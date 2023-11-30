import Env from "../src/common/configs/environment_config";
import { ENVIRONMENTS } from "../src/common/constants/app_constants";
import AppUtils from "../src/common/utils/AppUtils";

  describe('Test AppUtils Methods', () => {
    const appUtils = new AppUtils();

    test("Generate a default password of 8 characters", () => {
      expect(appUtils.createDefaultPassword()).toHaveLength(8);

      if (Env.ENVIRONMENT == ENVIRONMENTS.DEV) {
        expect(appUtils.createDefaultPassword()).toBe("password");
      }
    });
    

    test("Convert value to boolean", () => {
      expect(appUtils.createDefaultPassword()).toHaveLength(8);

      if (Env.ENVIRONMENT == ENVIRONMENTS.DEV) {
        expect(appUtils.convertToBoolean("false")).toBe(false);
        expect(appUtils.convertToBoolean("true")).toBe(true);
        expect(appUtils.convertToBoolean("FALSE")).toBe(false);
        expect(appUtils.convertToBoolean("true")).toBe(true);
        expect(appUtils.convertToBoolean("1")).toBe(true);
        expect(appUtils.convertToBoolean(0)).toBe(false);
      }
    });

  });