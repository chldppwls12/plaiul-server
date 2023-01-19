import { reportType } from '@utils/constants';
import { ReportReason } from '@entities/common/Enums';

const getReportReason = (reasonIdx: number) => {
  let reason!: ReportReason;
  switch (reasonIdx) {
    case reportType.CURSE:
      reason = ReportReason.CURSE;
      break;
    case reportType.PROMOTE:
      reason = ReportReason.PROMOTE;
      break;
    case reportType.ILLEGALITY:
      reason = ReportReason.ILLEGALITY;
      break;
    case reportType.OBSCENCE:
      reason = ReportReason.OBSCENCE;
      break;
    case reportType.LEAKAGE:
      reason = ReportReason.LEAKAGE;
      break;
    case reportType.SPAM:
      reason = ReportReason.SPAM;
      break;
    case reportType.ETC:
      reason = ReportReason.ETC;
      break;
  }

  return reason;
};

export { getReportReason };
