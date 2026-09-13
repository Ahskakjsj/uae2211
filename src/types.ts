export type EventType = 'server' | 'client' | 'local' | 'register' | 'vulnerability' | 'command' | 'webhook';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface EventOccurrence {
  name: string;
  file: string;
  line: number;
  type: EventType;
  context: string;
  severity: SeverityLevel;
  description?: string;
  remediation?: string;
  category?: string;
}

export interface ServerLogo {
  id: string;
  fileName: string;
  filePath: string;
  dataUrl: string;
  size: number;
  extension: string;
}

export interface DetectedProtection {
  name: string;
  type: 'AntiCheat' | 'Obfuscator' | 'Escrow' | 'LicenseGuard';
  vendor?: string;
  description: string;
  confidence: 'High' | 'Medium' | 'Low';
  filesFound: string[];
}

export interface Stats {
  totalFiles: number;
  luaFiles: number;
  serverEvents: number;
  clientEvents: number;
  localEvents: number;
  registrations: number;
  vulnerabilities: number;
  webhooks: number;
  obfuscationScore: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  detectedProtections?: DetectedProtection[];
  serverLogos?: ServerLogo[];
}
