import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "bst-oto-servis",
  name: "MS Oto Servis",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// Event tipleri
export type SendEmailEvent = {
  name: "notification/email.send";
  data: {
    to: string;
    subject: string;
    html: string;
    tenantId: string;
    customerId?: string;
  };
};

export type SendSmsEvent = {
  name: "notification/sms.send";
  data: {
    to: string;
    body: string;
    tenantId: string;
    customerId?: string;
  };
};

export type StockMovementCreatedEvent = {
  name: "stock/movement.created";
  data: {
    movementId: string;
    tenantId: string;
    partId?: string;
    purchaseOrderId?: string;
    stockCountId?: string;
    stockTransferId?: string;
  };
};

export type Events = SendEmailEvent | SendSmsEvent | StockMovementCreatedEvent;
