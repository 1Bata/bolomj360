import { schemaWrapper } from "erxes-api-shared/utils";
import { Schema, type Document } from "mongoose";

export interface IMessage {
  userId: string;
  name: string;
  contact: string;
  body: string;
  status: "new" | "read";
  createdAt: Date;
}

export interface IMessageDocument extends IMessage, Document {}

// Contact / volunteering requests from the community page. Read only through
// the bolomj360InboxRead permission.
export const messageSchema = schemaWrapper(
  new Schema({
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    contact: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    status: { type: String, enum: ["new", "read"], default: "new", index: true },
    createdAt: { type: Date, default: Date.now },
  }),
);
