import { ClientSession, Model, Schema, model} from "mongoose";
import { MongoId } from "../interfaces/types";

const SequenceCounterSchema = new Schema<ISequenceCounter, SequenceCounterModel>({

    current_count: {type: Number, required: true},
    type: {type: String, required: true, unique: true},
    previous_counter: { type: Schema.Types.ObjectId, ref: 'sequence_counter'},
    next_counter: { type: Schema.Types.ObjectId, ref: 'sequence_counter'},
    status: { type: String, default: "active", enum: ["active", "deactivated"]}
},
{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export interface ISequenceCounter {
    current_count: number,
    type: string,
    previous_counter: MongoId,
    next_counter: MongoId,
    status: string,

    _id: MongoId
}

interface SequenceCounterModel extends Model<ISequenceCounter> {
    getNextNumber(type: string, session?: ClientSession): number
}

SequenceCounterSchema.statics.getNextNumber = async function (type: string, session: ClientSession | null = null) {
    
    try {
        let counter = await this.findOneAndUpdate(
            {type: type},
            { $inc: { current_count: 1} },
            { new: true, session: session}
            );
            
            if (!counter) {
                const newCounter = new SequenceCounter({current_count: 1, type: type});
                counter = await newCounter.save({session: session});
            }
            
        return counter.current_count;
        
    } catch (error) {
        throw error;
    }
}
    
const SequenceCounter = model<ISequenceCounter, SequenceCounterModel>("sequence_counter", SequenceCounterSchema);
export default SequenceCounter;
