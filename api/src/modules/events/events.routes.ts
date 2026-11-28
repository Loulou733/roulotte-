//le flux en direct GET /events  chaque connexion s'abonne au bus et reçoit les commandes qu'elle a le droit de voir
import { Router } from "express";
import type { EventEmitter } from "node:events";
import type { Auth, AuthUser } from "../../fourni/auth/index.js";
import type { Order } from "../orders/orders.dto.js";
import { toOrderDto } from "../orders/orders.dto.js";
//la cuisine et l'admin reçoivent tout  un client reçoit juste order.updated de SA commande
export function canReceive(user: AuthUser, event: string, order: Order) {
  if (user.role === "STAFF" || user.role === "ADMIN") {
    return true;
  }
  return event === "order.updated" && order.customer.id === user.id;
}
export function createEventsRouter(events: EventEmitter, auth: Auth) {
  const router = Router();
  router.get("/events", auth.requireAuth, (req, res) => {
    const user = req.user!;
    //text/event-stream = la réponse reste ouverte et on écrit dedans au fur et à mesure
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    //un message SSE = une ligne event  une ligne data en JSON  puis une ligne vide
    function send(event: string, order: Order) {
      if (canReceive(user, event, order)) {
        res.write("event: " + event + "\n");
        res.write("data: " + JSON.stringify(toOrderDto(order)) + "\n\n");
      }
    }
    function onCreated(order: Order) {
      send("order.created", order);
    }
    function onUpdated(order: Order) {
      send("order.updated", order);
    }
    events.on("order.created", onCreated);
    events.on("order.updated", onUpdated);
    //un commentaire toutes les 25 s  sinon une connexion qui dit rien peut être coupée en route
    const ping = setInterval(() => {
      res.write(": ping\n\n");
    }, 25000);
    //le client ferme donc on se désabonne  sinon le bus garderait des connexions mortes
    req.on("close", () => {
      clearInterval(ping);
      events.off("order.created", onCreated);
      events.off("order.updated", onUpdated);
    });
  });
  return router;
}
