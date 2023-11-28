import LoginSession, {ILoginSession} from '../models/login_session';
import {HydratedDocument} from "mongoose";
import DBService from './DBService';

class LoginSessionService extends DBService<ILoginSession> {

    constructor(populatedFields:string[]|Record<string,string>[] = []) {
        super(LoginSession, populatedFields);
        
    }

    // public save(data: any, session = null): Promise<HydratedDocument<ILoginSession>> {
    //     const model = new LoginSession(data);
    //     return model.save({session: session});
    // }

    // public count(query = {}): Promise<number> {
    //     return new Promise((resolve, reject) => {
    //         LoginSession.countDocuments(query)
    //             .then((data) => {
    //                 resolve(data);
    //             })
    //             .catch((e) => {
    //                 reject(e);
    //             })
    //         ;
    //     });
    // }

    // public find(query = {}, sort = {}, limit = 300, session = null): Promise<HydratedDocument<ILoginSession>[]> {
    //     return new Promise((resolve, reject) => {
    //         LoginSession.find(query)
    //             .session(session)
    //             .limit(limit)
    //             .sort(sort)
    //             .then((data) => {
    //                 resolve(data);
    //             })
    //             .catch((e) => {
    //                 reject(e);
    //             })
    //         ;
    //     });
    // }

    // public findAndPopulate(query = {}, sort = {}, limit = 300, session = null): Promise<HydratedDocument<ILoginSession>[]> {
    //     return new Promise((resolve, reject) => {
    //         LoginSession.find(query)
    //             .session(session)
    //             .limit(limit)
    //             .populate(["user"])
    //             .sort(sort)
    //             .then((data:any) => {
    //                 resolve(data);
    //             })
    //             .catch((e) => {
    //                 reject(e);
    //             })
    //         ;
    //     });
    // }


    // public paginate(query = {}, limit = 300, page = 1): Promise<HydratedDocument<ILoginSession>[] > {
    //     const customLabels = {
    //         totalDocs: 'itemsCount',
    //         docs: 'data',
    //         limit: 'perPage',
    //         page: 'currentPage',
    //         nextPage: 'next',
    //         prevPage: 'prev',
    //         totalPages: 'pageCount',
    //         pagingCounter: 'serialNumber',
    //         meta: 'paginator'
    //     };

    //     const options = {
    //         page: page,
    //         limit: limit,
    //         customLabels: customLabels
    //     };

    //     return new Promise((resolve, reject) => {
    //         // @ts-ignore
    //         LoginSession.paginate(query, options)
    //             .then((data:any) => {
    //                 resolve(data);
    //             })
    //             .catch((e:Error) => {
    //                 reject(e);
    //             })
    //         ;
    //     });
    // }

    // public paginateAndPopulate(query = {}, limit = 300, sort = {}, page = 1): Promise<HydratedDocument<ILoginSession>[]> {
    //     const customLabels = {
    //         totalDocs: 'itemsCount',
    //         docs: 'data',
    //         limit: 'perPage',
    //         page: 'currentPage',
    //         nextPage: 'next',
    //         prevPage: 'prev',
    //         totalPages: 'pageCount',
    //         pagingCounter: 'serialNumber',
    //         meta: 'paginator'
    //     };

    //     const options = {
    //         page: page,
    //         limit: limit,
    //         sort: sort,
    //         customLabels: customLabels,
    //         populate: ["user"]
    //     };

    //     return new Promise((resolve, reject) => {
    //         // @ts-ignore
    //         LoginSession.paginate(query, options)
    //             .then((data:any) => {
    //                 resolve(data);
    //             })
    //             .catch((e:Error) => {
    //                 reject(e);
    //             })
    //         ;
    //     });
    // }

    // public findById(id:string, session = null): Promise<HydratedDocument<ILoginSession>> {
    //     return new Promise((resolve, reject) => {
    //         LoginSession.findById(id)
    //             .session(session)
    //             .then((data:any) => {
    //                 resolve(data);
    //             })
    //             .catch((e:Error) => {
    //                 reject(e);
    //             })
    //         ;
    //     });
    // }

    // public findByIdAndPopulate(id:string, session = null): Promise<HydratedDocument<ILoginSession>[]> {
    //     return new Promise((resolve, reject) => {
    //         LoginSession.findById(id).session(session)
    //             .populate("user")
    //             .session(session)
    //             .then((data:any) => {
    //                 resolve(data);
    //             })
    //             .catch((e:Error) => {
    //                 reject(e);
    //             })
    //         ;
    //     });
    // }

    // public findOne(query = {}, session = null): Promise<HydratedDocument<ILoginSession>> {
    //     return new Promise((resolve, reject) => {
    //         LoginSession.findOne(query)
    //             .session(session)
    //             .then((data:any) => {
    //                 resolve(data);
    //             })
    //             .catch((e:Error) => {
    //                 reject(e);
    //             })
    //         ;
    //     });
    // }

    // public findOneAndPopulate(query = {}, session = null): Promise<HydratedDocument<ILoginSession>> {
    //     return new Promise((resolve, reject) => {
    //         LoginSession.findOne(query)
    //             .session(session)
    //             .populate("user")
    //             .populate("employee")
    //             .then((data:any) => {
    //                 resolve(data);
    //             })
    //             .catch((e:Error) => {
    //                 reject(e);
    //             })
    //         ;
    //     });
    // }

    // public update(id:string, data:any, session = null): Promise<any> {
    //     return LoginSession.findByIdAndUpdate(id, data, {new: true})
    //     .session(session)
    //     .exec();
    // }

    // public updateOne(query:any, data:any, session = null): Promise<any> {
    //     return LoginSession.findOneAndUpdate(query, data, {new: true})
    //     .session(session)
    //     .exec();
    // }
}

export default LoginSessionService;
