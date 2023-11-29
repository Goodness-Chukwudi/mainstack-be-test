import RandomString, { GenerateOptions } from 'randomstring';
import bcrypt from 'bcryptjs';
import Jwt from "jsonwebtoken";
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';
import mongoose, { ClientSession } from 'mongoose';
import csv from "csvtojson"
import BaseResponseHandler from '../../controllers/base controllers/BaseResponseHandlerController';
import { json2csv, csv2json } from 'json-2-csv';
import { Readable } from 'stream';
import { ENVIRONMENTS } from '../constants/app_constants';
import Env from '../configs/environment_config';
import {UploadApiResponse, v2 as cloudinary} from 'cloudinary';
import Jimp from "jimp";

class AppUtils extends BaseResponseHandler {

    /**
     * Generates a UUID
    */
    public generateUUIDV4(): string {
        try {
            return uuidv4();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Generates a UUID (static method)
    */
    public static generateUUIDV4(): string {
        try {
            return uuidv4();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Generates an alphanumeric code
     * @param length a number that specifies the length of the generated code. Default is 6
     * @param capitalize a boolean that specifies if the letters should be uppercase or not. Default is false
     * @param readable a boolean that specifies if only readable characters should be generated. Default is true
     * @returns an alphanumeric string of the specified length
    */
    public getCode(length:number = 6, capitalize = false, readable = true): string {
        try {
            if (Env.ENVIRONMENT == ENVIRONMENTS.DEV) return "password";
    
            const options: GenerateOptions = {
                length: length,
                readable: readable,
                charset: "alphanumeric",
            }
            if (capitalize) {
                options.capitalization = "uppercase";
            }
            return RandomString.generate(options);

        } catch (error) {
            throw error
        }
    }


    /**
     * Generates an otp. Returns 123456 in development environment
     * @param length a number that specifies the length of the generated code. Default is 6
     * @returns an alphanumeric string of the specified length
    */
    public generateOTP(length:number = 6): string {
        try {
            if (Env.ENVIRONMENT == ENVIRONMENTS.DEV) {
                return "123456";
            }
            return this.getCode(length);
            
        } catch (error) {
            throw error
        }
    }

    /**
     * Generates an alphabetic code.
     * @param length a number that specifies the length of the generated code. Default is 6
     * @param capitalize a boolean that specifies if the letters should be uppercase or not. Default is false
     * @returns an alphabetic string of the specified length
    */
    public getAlphaCode(length:number = 6, capitalize:boolean = false): string {
        try {
            const options:GenerateOptions = {
                length: length,
                charset: 'alphabetic'
            }
            if (capitalize) {
                options.capitalization = "uppercase";
            }
            return RandomString.generate(options);
            
        } catch (error) {
            throw error;
        }
    }

    /**
     * Generates an authentication token. Signs the provided data into the token
     * @param loginSession the login session of type ILoginSession, created for a user's login
     * @returns an alphanumeric string of the specified length
    */
    public createAuthToken(userId: string, loginSessionId: string): string {
        try {

            const data: any = {user: userId, loginSession: loginSessionId};
            const token = Jwt.sign({ data: data}, Env.JWT_PRIVATE_KEY, { expiresIn: Env.JWT_EXPIRY });
            return token;
            
        } catch (error) {
            throw error
        }
    }

    /**
     * Verifies a jwt token and decodes the payload
     * @param token the jwt token to be verified
     * @param callback a callback function passed to jwt verify api on verification
     * @returns void
    */
    public verifyToken(token: string, callback:(err: any, decoded: any) => void) {
        Jwt.verify(token, Env.JWT_PRIVATE_KEY, (err, decoded) => {
            callback(err, decoded);
        });
    }
    
    /**
     * Generates a default password
     * @returns a string
    */
    createDefaultPassword(): string {
        try {
            return (Env.ENVIRONMENT === ENVIRONMENTS.DEV)? "password" : this.getCode(8);
            
        } catch (error) {
            throw error;
        }
    }

    /**
     * Hashes the provided data
     * @param data the data to be hashed
     * @param rounds number of rounds to use to generate the hash salt. Defaults to 12
     * @returns  A promise that resolves to string
    */
    public hashData(data: any, rounds = 12): Promise<string>{
        return new Promise(async (resolve, reject) => {
            try {
                const salt = await bcrypt.genSalt(rounds);
                const hash = bcrypt.hash(data, salt);
                resolve(hash);
            } catch (error) {
                reject(error);
            }
        });       
    }

    /**
     * Compares and validates the equality of a value with a hashed data
     * @param value the value to be compared with a hashed data
     * @param hashedData the hashed data to compare with the provided value
     * @returns  A promise that resolves to boolean. Returns true if the two values are equal, other wise false
    */
    public validateHashedData(value: any, hashedData: string): Promise<boolean>{
        return new Promise(async (resolve, reject) => {
            try {
                const valid = await bcrypt.compare(value, hashedData);
                resolve(valid);
            } catch (error) {
                reject(error);
            }
        });       
    }

    /**
     * Retrieves the bearer token from the authorization header of an express request
\     * @param req an instance of the express request to get the token from
     * @returns  a string
    */
    getTokenFromRequest(req: Request): string {
        const payload = req.headers.authorization || "";
        let jwt = "";
        if (payload) {
            if (payload.split(" ").length > 1) {
                jwt = payload.split(" ")[1];
                return jwt;
            }
        }
        return jwt;
    }

    /**
     * Converts a value to boolean
     * - "1", true, "true", "on", "yes", 1 converts to true while every other value converts to false
     * - value is not case sensitive
     * @param value the value (of type string|boolean|number) to be converted
     * @returns  a boolean
    */
    convertToBoolean(value: string|boolean|number): boolean {
        try {
            if (typeof value === "string") value = value.toLowerCase();
            const allowedTruthValues = ["1", "true", "on", "yes", 1, true];
            
            if (allowedTruthValues.includes(value)) return true;
            return false;
            
        } catch (error) {
            throw error;
        }
    }

    /**
     * Uploads a file to cloudinary

     * @param filePath file path of the file to be uploaded
     * @param publicId name you want to give the file
     * @returns  an object of type UploadApiResponse
    */
    uploadFile(filePath: string, publicId: string): Promise<UploadApiResponse> {
        return new Promise(async (resolve, reject) => {
            try {
                cloudinary.config(Env.CLOUDINARY_CONFIG);
                
                
                const result = await cloudinary.uploader.upload(filePath, { public_id: publicId });

                resolve(result);
            } catch (error:any) {
                reject(error);
            }
        })
    }

    /**
     * Resizes the dimensions of an image using the specified width

     * @param file metadata of the file to be resized
     * @param width desired width
     * @param quality the desired percentage of quality reduction. Defaults to 50
     * @returns  the modified file metadata
    */
    resizeImage = (file: any, width: number, quality = 50): Promise<any> => {

        return new Promise((resolve, reject) => {

            Jimp.read(file.tempFilePath, (error, result) => {
                if (error) reject(error);

                result
                .resize(width, Jimp.AUTO)
                .quality(quality)
                .write(file.tempFilePath);
                resolve(file)
              });
        })
    }

    /**
     * Creates a mongoose database transaction
     * @returns  a promise that resolves to a mongoose ClientSession
    */
    createMongooseTransaction(): Promise<ClientSession> {
        return new Promise((resolve, reject) => {
            let session: ClientSession;
            mongoose.startSession()
                .then(_session => {
                    session = _session;
                    session.startTransaction();
                })
                .then(() => {
                    resolve(session);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    /**
     * Converts a CSV file to JSON array
     * @param filePath the location of the CSV in the file system
     * @returns  a promise that resolves to an array of JSON objects
    */
    convertCsvToJsonFromFile(filePath: string): Promise<object[]> {

        return new Promise((resolve, reject) => {
            try {
                csv().fromFile(filePath)
                .then(async JsonObjects => {
                    resolve(JsonObjects)
                })
                
            } catch (error) {
                reject(error);
            }
        })
    }

    /**
     * Converts a JSON to CSV string
     * @param jsonArray an array of JSON objects to be converted to CSV
     * @returns  a promise that resolves to a CSV string
    */
    convertJsonToCsv = (jsonArray: any[]): Promise<string> => {

        return new Promise(async (resolve, reject) => {
            try {
                const options = {
                    emptyFieldValue: ""
                }
                const csv = await json2csv(jsonArray, options);
                resolve(csv);
            } catch (error) {
                reject(error);
            }
        })
    }
    
    /**
     * Converts a CSV string to JSON array
     * @param csv the CSV string to be converted to JSON array
     * @returns  a promise that resolves to a JSON array
    */
    convertCsvToJson = (csv: string): Promise<object[]> => {
    
        return new Promise(async (resolve, reject) => {
            try {
                const options = {
                    trimFieldValues: true,
                    trimHeaderFields: true,

                }
                const json = await csv2json(csv, options);
                resolve(json);
            } catch (error) {
                reject(error);
            }
        })
    }

    /**
     * Handles a CSV download response on a http request
     * @param fileName the name to be given to the file when downloaded
     * @param csvData CSV string to be streamed to the client
     * @param res the express response object with which to respond to the client
     * @returns  void
    */
    handleCSVDownloadResponse = async (fileName: string, csvData: string, res: Response) => {
        try {

            const csvBuffer = Buffer.from(csvData);
            const stream = Readable.from(csvBuffer);
        
            res.setHeader('Content-disposition', 'attachment; filename=' + fileName +".csv");
            res.setHeader('Content-type', "text/csv");
        
            stream.pipe(res);
            
        } catch (error) {
            throw error;
        }
    }
}

export default AppUtils;
