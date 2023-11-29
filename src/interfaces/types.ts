import { Model, ObjectId, Types } from "mongoose";

export type MongoId = Types.ObjectId|string|Model<any>