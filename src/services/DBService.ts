import {Model, HydratedDocument, ClientSession, ObjectId} from "mongoose";
import { ITEM_STATUS } from "../common/constants/app_constants";
import { PaginationCustomLabels } from "../common/configs/app_config";
import { MongoId } from "../interfaces/types";

/**
 * An abstract class that provides methods for performing DB queries.
 * Classes(entity service classes mostly) that extends this class:
 * - provide the interface of the mongoose document schema
 * - provide the mongoose model in the constructor
 * - inherit it's database access methods
 * @param Model A mongoose document model on which the query is performed
 * @param T interface of the document schema
*/
abstract class DBService<T> {

    private readonly populatedFields:string[]|Record<string,string>[];
    private readonly Model:Model<T>;

    constructor(Model:Model<T>, populatedPaths:string[]|Record<string,string>[]) {
        this.Model = Model;
        this.populatedFields = populatedPaths;
    }

    /**
     * Saves one or more documents using mongoose's insertMany api.
     * @param data List of documents to be saved
     * @param session An optional mongoose client session, required to commit a running database transaction if any
     * @returns  A promise resolving to:
     * - An acknowledged boolean, set to true if the operation ran with write concern or false if write concern was disabled
     * - An insertedIds array, containing _id values for each successfully inserted document
    */
    public saveMany(data:object[], session: ClientSession|null = null): Promise<object> {
        try {
            return this.Model.insertMany(data, {session: session});
        } catch (error) {
            throw error;
        }
    }

    /**
     * Saves document using mongoose's save api.
     * @param data Document to be saved
     * @param session An optional mongoose client session, required to commit a running database transaction if any
     * @returns  A promise resolving to the saved document
    */
    public save(data: object, session: ClientSession|null = null): Promise<any> {
        try {
            const model: HydratedDocument<T> = new this.Model(data);
            return model.save({session: session});
        } catch (error) {
            throw error;
        }
    }
        
    /**
     * Updates an existing document matching the provided query, creates a new one if no matching document was found.
     * @param query A mongoose query to match a document
     * @param data The update to be made
     * @param session An optional mongoose client session, required if the operation is in a transaction
     * @returns  A promise resolving to the updated or upserted document
    */
    public updateOrCreateNew(query: Record<string,any>, data: object, session: ClientSession|null = null, selectedFields:string[] = []): Promise<HydratedDocument<T>> {
        try {
            
            const finalQuery = query.status ? query : Object.assign(query, {status: {$ne: ITEM_STATUS.DELETED}});
            return this.Model.findOneAndUpdate(finalQuery, data, {new: true, upsert: true})
            .session(session)
            .select(selectedFields)
            .exec();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Counts the number of documents that matches the provided filter
     * @param query A mongoose query to match a document
     * @returns  A promise resolving to the number of matches found
    */
    public count(query = {}): Promise<number> {
        //@ts-ignore
        const finalQuery = query.status ? query : Object.assign(query, {status: {$ne: ITEM_STATUS.DELETED}});
        return new Promise((resolve, reject) => {
            this.Model.countDocuments(finalQuery)
                .then((data) => {
                    resolve(data);
                })
                .catch((e) => {
                    reject(e);
                })
            ;
        });
    }

    /**
     * Fetches all documents that matches the provided query
     * @param query An optional mongo query to fetch documents that matched the filter. Returns all documents if query isn't provided
     * @param selectedFields An optional array of string, containing fields in the document that are to be selected
     * @param sort An optional mongoose sort object specifying the field and order to sort the list with
     * @param session An optional mongoose client session, required if the operation is in a transaction
     * @returns  A promise resolving to a a list of documents that match filter
    */
    public find(query = {}, limit = 100, sort:any = null, selectedFields:string[] = [], session: ClientSession|null = null): Promise< HydratedDocument<T>[] > {
        //@ts-ignore
        const finalQuery = query.status ? query : Object.assign(query, {status: {$ne: ITEM_STATUS.DELETED}});
        return new Promise((resolve, reject) => {
            this.Model.find(finalQuery)
                .session(session)
                .sort(sort || {created_at: -1})
                .limit(limit)
                .select(selectedFields)
                .then((data) => {
                    resolve(data);
                })
                .catch((e) => {
                    reject(e);
                });
        });
    }

    /**
     * Fetches all deleted documents that matches the provided query
     * @param query An optional mongo query to fetch a list of documents that matched the filter
     * @param sort An optional mongoose sort object specifying the field and order to sort the list with
     * @returns  A promise resolving to a list of documents that match filter
    */
    public findDeleted(query = {}, sort = null): Promise< HydratedDocument<T>[] > {
        const finalQuery = Object.assign(query, {status: ITEM_STATUS.DELETED});
        return new Promise((resolve, reject) => {
            this.Model.find(finalQuery)
                .sort(sort || {created_at: -1})
                .then((data) => {
                    resolve(data);
                })
                .catch((e) => {
                    reject(e);
                });
        });
    }

    /**
     * Fetches all documents that matches the provided filter. The specified ref paths are populated
     * @param query An optional mongo query to fetch a list of documents that matched the filter
     * @param selectedFields An optional array of string, containing fields in the document that are to be selected
     * @param populatedFields An optional array of string or objects, specifying fields in the document that are to be populated
     * @param sort An optional mongoose sort object specifying the field and order to sort the list with
     * @param session An optional mongoose client session, required if the operation is in a transaction
     * @returns  A promise resolving to a list of documents that match filter
    */
    public findAndPopulate(query = {}, selectedFields:string[] = [], populatedFields:string[]|Record<string,string>[] = [], sort:any = null, session: ClientSession|null = null): Promise< HydratedDocument<T>[] > {
        //@ts-ignore
        const finalQuery = query.status ? query : Object.assign(query, {status: {$ne: ITEM_STATUS.DELETED}});
        return new Promise((resolve, reject) => {
            if (populatedFields.length == 0) populatedFields = this.populatedFields;

            this.Model.find(finalQuery)
                .session(session)
                //@ts-ignore
                .populate(populatedFields)
                .sort(sort || {created_at: -1})
                .select(selectedFields)
                .then((data:any) => {
                    resolve(data);
                })
                .catch((e) => {
                    reject(e);
                });
        });
    }

    /**
     * Fetches a paginated list of documents that matches the provided filter.
     * @param query An optional mongo query to fetch a list of documents that matched the filter
     * @param limit Sets the number of documents per page. Default is 10
     * @param page Sets the page to fetch. Default is 1
     * @param selectedFields An optional array of string, containing fields in the document that are to be selected
     * @param populatedFields An optional array of string or objects, specifying fields in the document that are to be populated
     * @param sort An optional mongoose sort object specifying the field and order to sort the list with
     * @returns  A promise resolving to a paginated list of documents that match filter
    */
    public paginate(query = {}, limit:any = 10, page:any = 1, sort:any = null, selectedFields:string[] = []): Promise< HydratedDocument<T>[] > {

        //@ts-ignore
        const finalQuery = query.status ? query : Object.assign(query, {status: {$ne: ITEM_STATUS.DELETED}});

        const options = {
            select: selectedFields,
            page: page || 1,
            limit: limit || 10,
            sort: sort || {created_at: -1},
            customLabels: PaginationCustomLabels
        };

        return new Promise((resolve, reject) => {
            // @ts-ignore
            this.Model.paginate(finalQuery, options)
                .then((data:any) => {
                    resolve(data);
                })
                .catch((e:Error) => {
                    reject(e);
                });
        });
    }

    /**
     * Fetches a paginated list of documents that matches the provided filter. The specified ref paths are populated
     * @param query An optional mongo query to fetch a list of documents that matched the filter
     * @param limit Sets the number of documents per page. Default is 10
     * @param page Sets the page to fetch. Default is 1
     * @param selectedFields An optional array of string, containing fields in the document that are to be selected
     * @param populatedFields An optional array of string or objects, specifying fields in the document that are to be populated
     * @param sort An optional mongoose sort object specifying the field and order to sort the list with
     * @returns  A promise resolving to a paginated list of documents that match filter. The ref paths are populated with it's parent documents
    */
    public paginateAndPopulate(query = {}, limit:any = 10, page:any = 1, sort:any = null, selectedFields:string[] = [], populatedFields:string[]|Record<string,string>[] = []): Promise< HydratedDocument<T>[] > {
        //@ts-ignore
        const finalQuery = query.status ? query : Object.assign(query, {status: {$ne: ITEM_STATUS.DELETED}});

        if (populatedFields.length == 0) populatedFields = this.populatedFields;

        const options = {
            select: selectedFields,
            page: page,
            limit: limit,
            sort: sort || {created_at: -1},
            customLabels: PaginationCustomLabels,
            populate: populatedFields
        };

        return new Promise((resolve, reject) => {
            // @ts-ignore
            this.Model.paginate(finalQuery, options)
                .then((data:any) => {
                    resolve(data);
                })
                .catch((e:Error) => {
                    reject(e);
                })
            ;
        });
    }

    /**
     * Fetches a document with the provided id.
     * @param id The object id of the document to be fetched
     * @param selectedFields An optional array of string, containing fields in the document that are to be selected
     * @param session An optional mongoose client session, required if the operation is in a transaction
     * @returns  A promise resolving to a mongodb document.
    */
   public findById(id: MongoId, selectedFields:string[] = [], session: ClientSession|null = null): Promise<HydratedDocument<T>> {
        return new Promise((resolve, reject) => {
            this.Model.findById(id)
                .session(session)
                .select(selectedFields)
                .then((data:any) => {
                    resolve(data);
                })
                .catch((e:Error) => {
                    reject(e);
                })
            ;
        });
    }

    /**
     * Fetches a document with the provided id. The specified ref paths are populated
     * @param id The object id of the document to be fetched
     * @param selectedFields An optional array of string, containing fields in the document that are to be selected
     * @param populatedFields An optional array of string or objects, specifying fields in the document that are to be populated
     * @param session An optional mongoose client session, required if the operation is in a transaction
     * @returns  A promise resolving to a mongodb document. The ref paths are populated with it's parent documents
    */
    public findByIdAndPopulate(id:string|ObjectId, selectedFields:string[] = [], populatedFields:string[]|Record<string,string>[] = [], session: ClientSession|null = null): Promise<HydratedDocument<T>> {
        return new Promise((resolve, reject) => {
            if (populatedFields.length == 0) populatedFields = this.populatedFields;

            this.Model.findById(id).session(session)
            //@ts-ignore
                .populate(populatedFields)
                .session(session)
                .select(selectedFields)
                .then((data:any) => {
                    resolve(data);
                })
                .catch((e:Error) => {
                    reject(e);
                })
            ;
        });
    }


    /**
     * Fetches a document that matched the provided filter.
     * @param query An mongo query to fetch a document that matches the filter
     * @param selectedFields An optional array of string, containing fields in the document that are to be selected
     * @param session An optional mongoose client session, required if the operation is in a transaction
     * @returns  A promise resolving to a mongodb document.
    */
    public findOne(query = {}, selectedFields:string[] = [], session: ClientSession|null = null): Promise<HydratedDocument<T>> {
        //@ts-ignore
        const finalQuery = query.status ? query : Object.assign(query, {status: {$ne: ITEM_STATUS.DELETED}});
        return new Promise((resolve, reject) => {
            this.Model.findOne(finalQuery)
                .session(session)
                .select(selectedFields)
                .then((data:any) => {
                    resolve(data);
                })
                .catch((e:Error) => {
                    reject(e);
                })
            ;
        });
    }

    /**
     * Fetches a document that matched the provided filter. The specified ref paths are populated
     * @param query An optional mongo query to fetch a list of documents that match filter
     * @param selectedFields An optional array of string, containing fields in the document that are to be selected
     * @param populatedFields An optional array of string or objects, specifying fields in the document that are to be populated
     * @param session An optional mongoose client session, required if the operation is in a transaction
     * @returns  A promise resolving to a mongodb document. The ref paths are populated with it's parent documents
    */
    public findOneAndPopulate(query = {}, selectedFields:string[] = [], populatedFields:string[]|Record<string,string>[] = [], session: ClientSession|null = null): Promise<HydratedDocument<T>> {
        //@ts-ignore
        const finalQuery = query.status ? query : Object.assign(query, {status: {$ne: ITEM_STATUS.DELETED}});
        return new Promise((resolve, reject) => {
            if (populatedFields.length == 0) populatedFields = this.populatedFields;

            this.Model.findOne(finalQuery)
            //@ts-ignore
                .populate(populatedFields)
                .session(session)
                .select(selectedFields)
                .then((data:any) => {
                    resolve(data);
                })
                .catch((e:Error) => {
                    reject(e);
                })
            ;
        });
    }

    /**
     * Updates a document that matches the provided object id
     * @param id The object id of the document to be updated
     * @param data The update to be made
     * @param session An optional mongoose client session, required if the operation is in a transaction
     * @param selectedFields An optional array of string, containing fields in the document that are to be selected
     * @returns  A promise resolving to a mongodb document. The ref paths are populated with it's parent documents
    */
    public updateById(id:string|ObjectId, data:object, session: ClientSession|null = null, selectedFields:string[] = []): Promise<HydratedDocument<T>> {
        return new Promise((resolve, reject) => {
            this.Model.findByIdAndUpdate(id, data, {new: true})
            .session(session)
            .select(selectedFields)
            .then((data:any) => {
                resolve(data);
            })
            .catch((e:Error) => {
                reject(e);
            })
        });
    }

    /**
     * Updates a document that matches the provided object filter
     * @param query An optional mongo query to match the document that's to be updated
     * @param data The update to be made
     * @param session An optional mongoose client session, required if the operation is in a transaction
     * @param selectedFields An optional array of string, containing fields in the document that are to be selected
     * @returns A promise resolving to the updated mongodb document.
    */
    public updateOne(query: Record<string,any>, data: object, session: ClientSession|null = null, selectedFields:string[] = []): Promise<HydratedDocument<T>> {
        return new Promise((resolve, reject) => {
            const finalQuery = query.status ? query : Object.assign(query, {status: {$ne: ITEM_STATUS.DELETED}});
            this.Model.findOneAndUpdate(finalQuery, data, {new: true})
            .session(session)
            .select(selectedFields)
            .then((data:any) => {
                resolve(data);
            })
            .catch((e:Error) => {
                reject(e);
            })
        });
    }

    /**
     * Updates a document that matches the provided object filter
     * @param query An optional mongo query to match the document that's to be updated
     * @param data The update to be made
     * @param session An optional mongoose client session, required if the operation is in a transaction
     * @param selectedFields An optional array of string, containing fields in the document that are to be selected
     * @returns A promise resolving to an object that contains:
     * - acknowledged, a boolean, that;s set to true, if a successful update was made
     * - matchedCount, the number of documents that matched the provided query
     * - modifiedCount, the number of documents that were updated
     * - upsertedCount, the number of documents that were upserted
     * - upsertedId, the id of the upserted document
    */
    public updateMany(query: Record<string, any>, data:object, session: ClientSession|null = null, selectedFields:string[] = []): Promise<object> {
        return new Promise((resolve, reject) => {
            const finalQuery = query.status ? query : Object.assign(query, {status: {$ne: ITEM_STATUS.DELETED}});
            this.Model.updateMany(finalQuery, data, {new: true})
            .session(session)
            .select(selectedFields)
            .then((data:any) => {
                resolve(data);
            })
            .catch((e:Error) => {
                reject(e);
            })
        });
    }

    /**
     * Deletes all documents that match the provided filter
     * @param query An optional mongo query to match the documents that are to be deleted
     * @param session An optional mongoose client session, required if the operation is in a transaction
     * @returns A promise resolving to mongoose's DeleteResult.
    */
    public deleteMany(query: object, session: ClientSession|null = null): Promise<object> {
        try {
            return this.Model.deleteMany(query).session(session).exec()
            
        } catch (error) {
            throw error;
        }
    }

    /**
     * Deletes the first document that matches the provided filter
     * @param query An optional mongo query to match the document to be deleted
     * @param session An optional mongoose client session, required if the operation is in a transaction
     * @returns A promise resolving to mongoose's DeleteResult.
    */
    public deleteOne(query: object, session: ClientSession|null = null): Promise<object> {
        try {
            return this.Model.deleteOne(query).session(session).exec();
            
        } catch (error) {
            throw error;
        }
    }
}

export default DBService;