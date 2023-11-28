import DBService from './DBService';
import UserPassword, { IUserPassword } from '../models/user_password';

class PasswordService extends DBService<IUserPassword> {

    constructor(populatedFields:string[]|Record<string,string>[] = []) {
        super(UserPassword, populatedFields);
    }

    // async sendPasswordUpdateOTP(user: IUser, otp: string) {
    //     //send password update otp to user's email
    //     const recipient = user.email;
    //     const subject = "ASL Password Update OTP"
    //     //@ts-ignore
    //     const htmlTemplate = this.emailTemplateUtils.generatePasswordUpdateTemplate(user.full_name, otp, Env.PASSWORD_COMPROMISE_URL_UPDATE!);
    //     await this.emailService.sendCode(recipient, subject, htmlTemplate);
    // }
}

export default PasswordService;
