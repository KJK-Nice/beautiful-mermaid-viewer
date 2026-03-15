import {
  getAllDiagrams,
  getDiagramById,
  createDiagram,
  updateDiagram,
  deleteDiagram,
} from "./db";
import type { CreateDiagramInput, UpdateDiagramInput } from "./types";

const PORT = process.env.PORT || 3001;

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const method = req.method;

    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // API Routes
    if (pathname === "/api/diagrams" && method === "GET") {
      const diagrams = getAllDiagrams();
      return jsonResponse(diagrams);
    }

    if (pathname === "/api/diagrams" && method === "POST") {
      try {
        const body = (await req.json()) as CreateDiagramInput;
        if (!body.name || !body.mermaid_code) {
          return errorResponse("Name and mermaid_code are required");
        }
        const diagram = createDiagram(body);
        return jsonResponse(diagram, 201);
      } catch (e) {
        return errorResponse("Invalid request body");
      }
    }

    // Single diagram routes
    const diagramMatch = pathname.match(/^\/api\/diagrams\/(\d+)$/);
    if (diagramMatch) {
      const id = parseInt(diagramMatch[1], 10);

      if (method === "GET") {
        const diagram = getDiagramById(id);
        if (!diagram) {
          return errorResponse("Diagram not found", 404);
        }
        return jsonResponse(diagram);
      }

      if (method === "PUT") {
        try {
          const body = (await req.json()) as UpdateDiagramInput;
          const diagram = updateDiagram(id, body);
          if (!diagram) {
            return errorResponse("Diagram not found", 404);
          }
          return jsonResponse(diagram);
        } catch (e) {
          return errorResponse("Invalid request body");
        }
      }

      if (method === "DELETE") {
        const success = deleteDiagram(id);
        if (!success) {
          return errorResponse("Diagram not found", 404);
        }
        return jsonResponse({ success: true });
      }
    }

    // Health check
    if (pathname === "/api/health") {
      return jsonResponse({ status: "ok" });
    }

    return errorResponse("Not found", 404);
  },
});

console.log(`Server running at http://localhost:${PORT}`);
