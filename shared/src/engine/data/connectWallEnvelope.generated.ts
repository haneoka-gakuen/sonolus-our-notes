// Normalized formal v70 wall emission; the resource carrier owns profile colour and HDR.
export const standardConnectWallGain = (age: number) => {
  if (age < 0 || age >= 0.3333333333333333) return 0;
  if (age < 0.016666666666666666) return 0 + (age - 0) * 0;
  if (age < 0.041666666666666664) return 0 + (age - 0.016666666666666666) * 35.4978354978355;
  if (age < 0.05) return 0.8874458874458875 + (age - 0.041666666666666664) * 13.506493506493493;
  if (age < 0.1) return 1 + (age - 0.05) * 0;
  if (age < 0.10833333333333334) return 1 + (age - 0.1) * -1.558441558441546;
  if (age < 0.31666666666666665) return 0.9870129870129871 + (age - 0.10833333333333334) * -4.737662337662338;
  if (age < 0.3333333333333333) return 0 + (age - 0.31666666666666665) * 0;
  return 0;
};
export const simpleConnectWallGain = (age: number) => {
  if (age < 0 || age >= 0.3333333333333333) return 0;
  if (age < 0.016666666666666666) return 0 + (age - 0) * 0;
  if (age < 0.03333333333333333) return 0 + (age - 0.016666666666666666) * 53.24675324675325;
  if (age < 0.041666666666666664) return 0.8874458874458875 + (age - 0.03333333333333333) * 13.506493506493506;
  if (age < 0.075) return 1 + (age - 0.041666666666666664) * 0;
  if (age < 0.08333333333333333) return 1 + (age - 0.075) * -6.233766233766238;
  if (age < 0.1) return 0.948051948051948 + (age - 0.08333333333333333) * -7.012987012987004;
  if (age < 0.21666666666666667) return 0.8311688311688312 + (age - 0.1) * -7.124304267161411;
  if (age < 0.3333333333333333) return 0 + (age - 0.21666666666666667) * 0;
  return 0;
};
