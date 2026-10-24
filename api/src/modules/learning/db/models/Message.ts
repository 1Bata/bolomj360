import type { Model } from "mongoose";
import type { IModels } from "../../../../connectionResolvers.ts";
import { type IMessageDocument, messageSchema } from "../definitions/message.ts";

export interface IMessageInput {
  userId: string;
  name: string;
  contact: string;
  body: string;
}

export interface IMessageModel extends Model<IMessageDocument> {
  createMessage(input: IMessageInput): Promise<IMessageDocument>;
}

export const loadMessageClass = (models: IModels) => {
  class Message {
    public static createMessage(input: IMessageInput) {
      return models.Messages.create({
        ...input,
        status: "new",
        createdAt: new Date(),
      });
    }
  }

  messageSchema.loadClass(Message);

  return messageSchema;
};
