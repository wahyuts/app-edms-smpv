import { DemoDataResetService } from "@/features/user-management/services/demo-data-reset.service";

const reset = async (payload) => {
  return DemoDataResetService.resetAllDemoData(payload);
};

export const ResetDemoDataService = { reset };

export default ResetDemoDataService;
