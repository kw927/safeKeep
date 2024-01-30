export interface TOTPData {
    totpEnabled: boolean,
    totpQRCode: string | null,
    totpKeyUri: string | null,
    totpSecret: string | null
  }

export interface TOTPStepsProps {
    totpData: TOTPData;
}