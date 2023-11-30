import { Model, ObjectId, Types } from "mongoose";

export type MongoId = typeof Types.ObjectId|string|Model<any>

export type ErrorResponseData = Record<string,any[]> | undefined