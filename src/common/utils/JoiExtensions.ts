import { Root } from "joi";
import { isValidObjectId} from "mongoose";
import { JoiExtensionFactory } from "../../interfaces/interfaces";

/**
 * A class whose member methods provide extension to Joi validators
*/
class ValidationExtensions {

  /**
   * A Joi extension for validating mongo object ids
   * - the extension factory returned by this method, provides custom validation for object ids
   * @returns an extension factory function of type ObjectIdExtension for object mongo object ids
  */
  objectIdExtension() {
    const extension: typeof JoiExtensionFactory = (joi:Root) => ({
        type: "string",
        base: joi.string(),
        messages: {
            'string.objectId': '{{#label}} must be a valid Id',
        },
        rules: {
            objectId: {
              validate: (value:string, helpers:any) => {
                const alphaNumRegex = new RegExp(/^[a-z0-9]+$/);
                if (!isValidObjectId(value) || !alphaNumRegex.test(value)) {
                    return helpers.error('string.objectId');
                }
      
                return value;
              }
            }
          }
    });

    return extension;
  }

  /**
   * A Joi extension for validating dates
   * - the extension factory returned by this method, provides custom validation for dates in multiple formats
   * @returns an extension factory function for validating dates
  */
  dateExtension() {
    const hat  = require('@joi/date');
    return require('@joi/date');
  }
}

const JoiExtensions = new ValidationExtensions();
const objectId = JoiExtensions.objectIdExtension();
const date = JoiExtensions.dateExtension();

export default JoiExtensions;

export {
  objectId,
  date
}