package com.peladahub;

import com.peladahub.connection.ConnectionFactory;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.sql.*;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** Servidor HTTP mínimo: hospeda a interface e salva/restaura o estado da rodada. */
public final class WebServer {
  private WebServer() {}

  /** PIN do organizador: protege leitura e escrita da rodada em /api/state. */
  private static final byte[] PIN = carregarPin();
  private static final int MAX_TENTATIVAS = 5;
  private static final long BLOQUEIO_MS = 5 * 60_000;
  private static final Map<String, long[]> FALHAS = new ConcurrentHashMap<>();
  private static final int MAX_PAYLOAD = 1_000_000;

  private static byte[] carregarPin() {
    String pin = System.getenv("PELADAHUB_PIN");
    if (pin == null || pin.isBlank()) {
      pin = String.format("%06d", new SecureRandom().nextInt(1_000_000));
      System.out.println("AVISO: PELADAHUB_PIN não configurado. PIN temporário desta execução: " + pin);
    } else if (pin.length() < 4) {
      throw new IllegalStateException("PELADAHUB_PIN precisa ter pelo menos 4 caracteres.");
    }
    return pin.getBytes(StandardCharsets.UTF_8);
  }

  public static void start(int port) throws IOException {
    prepareDatabase();
    HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
    server.createContext("/api/state", WebServer::state);
    server.createContext("/", WebServer::staticFile);
    server.setExecutor(null);
    server.start();
    System.out.println("PeladaHub disponível em http://localhost:" + port);
  }
  private static void prepareDatabase() {
    try (Connection c = new ConnectionFactory().getConnection(); Statement s = c.createStatement()) {
      s.executeUpdate("CREATE TABLE IF NOT EXISTS rodada_estado (id INT PRIMARY KEY, payload LONGTEXT NOT NULL, atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)");
    } catch (RuntimeException | SQLException e) { throw new IllegalStateException("Falha ao preparar o banco de dados", e); }
  }
  /** Confere o PIN enviado no cabeçalho X-PeladaHub-Pin, bloqueando o IP após várias tentativas erradas. */
  private static boolean autorizado(HttpExchange x) throws IOException {
    String ip = ipCliente(x);
    long agora = System.currentTimeMillis();
    if (FALHAS.size() > 10_000) FALHAS.clear();
    long[] f = FALHAS.get(ip);
    if (f != null && f[0] >= MAX_TENTATIVAS && agora - f[1] < BLOQUEIO_MS) {
      send(x, 429, "{\"error\":\"Muitas tentativas. Aguarde alguns minutos.\"}");
      return false;
    }
    String enviado = x.getRequestHeaders().getFirst("X-PeladaHub-Pin");
    if (enviado != null && MessageDigest.isEqual(PIN, enviado.getBytes(StandardCharsets.UTF_8))) {
      FALHAS.remove(ip);
      return true;
    }
    if (enviado != null) {
      FALHAS.compute(ip, (k, v) -> v == null || agora - v[1] >= BLOQUEIO_MS ? new long[] {1, agora} : new long[] {v[0] + 1, agora});
    }
    send(x, 401, "{\"error\":\"PIN inválido\"}");
    return false;
  }

  /**
   * Atrás do proxy do Render/Railway o IP real é o último item de X-Forwarded-For
   * (o que o próprio proxy adicionou); sem proxy, usa o endereço da conexão.
   */
  private static String ipCliente(HttpExchange x) {
    String xff = x.getRequestHeaders().getFirst("X-Forwarded-For");
    if (xff != null && !xff.isBlank()) {
      String[] partes = xff.split(",");
      return partes[partes.length - 1].trim();
    }
    return x.getRemoteAddress().getAddress().getHostAddress();
  }

  private static void state(HttpExchange x) throws IOException {
    headers(x, "application/json; charset=utf-8");
    if (!autorizado(x)) return;
    try (Connection c = new ConnectionFactory().getConnection()) {
      if ("GET".equals(x.getRequestMethod())) {
        try (PreparedStatement p = c.prepareStatement("SELECT payload FROM rodada_estado WHERE id=1"); ResultSet r = p.executeQuery()) {
          send(x, 200, r.next() ? r.getString(1) : "{}");
        }
      } else if ("PUT".equals(x.getRequestMethod())) {
        // Lê no máximo MAX_PAYLOAD + 1 bytes para não carregar corpos enormes na memória.
        byte[] corpo = x.getRequestBody().readNBytes(MAX_PAYLOAD + 1);
        if (corpo.length > MAX_PAYLOAD) { send(x, 413, "{\"error\":\"Estado muito grande\"}"); return; }
        String payload = new String(corpo, StandardCharsets.UTF_8).trim();
        if (!payload.startsWith("{") || !payload.endsWith("}")) { send(x, 400, "{\"error\":\"Estado inválido\"}"); return; }
        try (PreparedStatement p = c.prepareStatement("INSERT INTO rodada_estado(id,payload) VALUES(1,?) ON DUPLICATE KEY UPDATE payload=VALUES(payload)")) { p.setString(1, payload); p.executeUpdate(); }
        send(x, 204, "");
      } else send(x, 405, "{\"error\":\"Método não permitido\"}");
    } catch (Exception e) { send(x, 500, "{\"error\":\"Erro ao acessar a rodada\"}"); }
  }
  private static void staticFile(HttpExchange x) throws IOException {
    String path = x.getRequestURI().getPath(); if (path.equals("/")) path = "/index.html";
    if (path.contains("..")) { headers(x, "text/plain; charset=utf-8"); send(x, 403, "Acesso negado"); return; }
    try (InputStream in = WebServer.class.getResourceAsStream("/static" + path)) {
      if (in == null) { headers(x, "text/plain; charset=utf-8"); send(x, 404, "Não encontrado"); return; }
      headers(x, mime(path));
      // Arquivos gerados pelo Vite em /assets têm hash no nome: podem ficar em cache para sempre.
      if (path.startsWith("/assets/")) x.getResponseHeaders().set("Cache-Control", "public, max-age=31536000, immutable");
      send(x, 200, in.readAllBytes());
    }
  }
  private static final Map<String, String> MIME = Map.of(
      ".css", "text/css; charset=utf-8",
      ".js", "application/javascript; charset=utf-8",
      ".json", "application/json; charset=utf-8",
      ".webmanifest", "application/manifest+json; charset=utf-8",
      ".svg", "image/svg+xml",
      ".png", "image/png",
      ".ico", "image/x-icon",
      ".woff2", "font/woff2");
  private static String mime(String p) {
    int dot = p.lastIndexOf('.');
    return dot < 0 ? "text/html; charset=utf-8" : MIME.getOrDefault(p.substring(dot), "text/html; charset=utf-8");
  }
  private static final String CSP = String.join("; ",
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data:",
      "connect-src 'self'",
      "manifest-src 'self'",
      "worker-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'");
  private static void headers(HttpExchange x, String type) {
    var h = x.getResponseHeaders();
    h.set("Content-Type", type);
    h.set("Cache-Control", "no-store");
    h.set("X-Content-Type-Options", "nosniff");
    h.set("X-Frame-Options", "DENY");
    h.set("Referrer-Policy", "no-referrer");
    h.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    h.set("Content-Security-Policy", CSP);
  }
  private static void send(HttpExchange x, int code, String value) throws IOException { send(x, code, value.getBytes(StandardCharsets.UTF_8)); }
  private static void send(HttpExchange x, int code, byte[] value) throws IOException { x.sendResponseHeaders(code, code == 204 ? -1 : value.length); if (code != 204) try (OutputStream o=x.getResponseBody()) { o.write(value); } }
}
