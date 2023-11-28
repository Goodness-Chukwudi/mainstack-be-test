import 'dotenv/config'

interface IEnv {
    ENVIRONMENT: string,
    PORT: number,
    ALLOWED_ORIGINS: string,
    API_VERSION: string,
    API_PATH: string,
    MONGODB_URI: string,
    JWT_PRIVATE_KEY: string,
    JWT_EXPIRY: string,
    
    SUPER_ADMIN_FIRST_NAME: string,
    SUPER_ADMIN_MIDDLE_NAME: string,
    SUPER_ADMIN_LAST_NAME: string,
    SUPER_ADMIN_EMAIL: string,
    SUPER_ADMIN_PHONE: string,
    SUPER_ADMIN_GENDER: string
}


const Env: IEnv = {
    ENVIRONMENT: process.env.ENVIRONMENT as string,
    PORT: process.env.PORT as unknown as number,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS as string,
    API_VERSION: process.env.API_VERSION as string,
    API_PATH: "/api/" + process.env.API_VERSION,
    JWT_PRIVATE_KEY: process.env.JWT_PRIVATE_KEY as string,
    JWT_EXPIRY: process.env.JWT_EXPIRY as string,
    MONGODB_URI: process.env.MONGODB_URI as string,

    SUPER_ADMIN_FIRST_NAME: process.env.SUPER_ADMIN_FIRST_NAME as string,
    SUPER_ADMIN_MIDDLE_NAME: process.env.SUPER_ADMIN_MIDDLE_NAME as string,
    SUPER_ADMIN_LAST_NAME: process.env.SUPER_ADMIN_LAST_NAME as string,
    SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL as string,
    SUPER_ADMIN_PHONE: process.env.SUPER_ADMIN_PHONE as string,
    SUPER_ADMIN_GENDER: process.env.SUPER_ADMIN_GENDER as string,
}

export default Env;