import React, { useState, useEffect, useMemo } from 'react';
import {
  Fingerprint,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  Download,
  Terminal,
  Cpu,
  ChevronDown,
  ChevronRight,
  Shield,
  Layers,
  Sparkles,
  Lock,
  Unlock,
} from 'lucide-react';
import { BiometricSecurityLog, BiometricAuthStatus } from '../types';
import { SecurityLogService } from '../utils/securityLogService';
import { playSound } from '../utils/audio';

interface BiometricSecurityLogViewProps {
  soundEffects: boolean;
}

export const BiometricSecurityLogView: React.FC<BiometricSecurityLogViewProps> = ({
  soundEffects,
}) => {
  const [logs, setLogs] = useState<BiometricSecurityLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED' | 'BIOMETRIC_ONLY'>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isProbing, setIsProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<string | null>(null);
  const [hardwareSupported, setHardwareSupported] = useState<boolean | null>(null);

  // Load logs on mount
  const refreshLogs = () => {
    const loaded = SecurityLogService.getLogs();
    setLogs(loaded);
  };

  useEffect(() => {
    refreshLogs();
    // Check hardware availability
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.()
        .then((available) => setHardwareSupported(available))
        .catch(() => setHardwareSupported(false));
    } else {
      setHardwareSupported(false);
    }
  }, []);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Status Filter
      if (statusFilter === 'SUCCESS' && log.status !== 'SUCCESS') return false;
      if (statusFilter === 'FAILED' && log.status === 'SUCCESS') return false;
      if (
        statusFilter === 'BIOMETRIC_ONLY' &&
        log.method !== 'BIOMETRIC_PASSKEY' &&
        log.method !== 'WEBAUTHN_GATE_PROBE'
      ) {
        return false;
      }

      // Search Query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        log.operatorIdentifier.toLowerCase().includes(q) ||
        (log.credentialId && log.credentialId.toLowerCase().includes(q)) ||
        (log.failureReason && log.failureReason.toLowerCase().includes(q)) ||
        log.method.toLowerCase().includes(q) ||
        log.status.toLowerCase().includes(q) ||
        (log.authenticatorType && log.authenticatorType.toLowerCase().includes(q))
      );
    });
  }, [logs, searchQuery, statusFilter]);

  // Telemetry metrics
  const totalCount = logs.length;
  const successCount = logs.filter((l) => l.status === 'SUCCESS').length;
  const failedCount = logs.filter((l) => l.status !== 'SUCCESS').length;
  const biometricCount = logs.filter(
    (l) => l.method === 'BIOMETRIC_PASSKEY' || l.method === 'WEBAUTHN_GATE_PROBE'
  ).length;
  const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 100;

  // Run live hardware WebAuthn sensor probe
  const handleTestProbe = async () => {
    if (soundEffects) playSound('boot');
    setIsProbing(true);
    setProbeResult(null);

    try {
      const newLog = await SecurityLogService.testWebAuthnProbe();
      refreshLogs();
      setExpandedLogId(newLog.id);

      if (newLog.status === 'SUCCESS') {
        if (soundEffects) playSound('chime');
        setProbeResult(`Hardware Enclave Probe Passed: Latency ${newLog.latencyMs}ms`);
      } else {
        if (soundEffects) playSound('error');
        setProbeResult(`Probe Handshake Terminated: ${newLog.failureReason || newLog.status}`);
      }
    } catch (err: any) {
      if (soundEffects) playSound('error');
      setProbeResult(`Sensor query exception: ${err.message}`);
    } finally {
      setIsProbing(false);
    }
  };

  // Clear all logs
  const handleClearLogs = () => {
    if (soundEffects) playSound('click');
    if (confirm('Are you sure you want to purge all biometric and authentication security records?')) {
      SecurityLogService.clearLogs();
      setLogs([]);
    }
  };

  // Export JSON logs
  const handleExportLogs = () => {
    if (soundEffects) playSound('click');
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `aether_biometric_security_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getStatusBadge = (status: BiometricAuthStatus) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            SUCCESS
          </span>
        );
      case 'USER_CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-amber-500/30 bg-amber-950/40 text-amber-300 text-[10px] font-bold">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            USER CANCELLED
          </span>
        );
      case 'CHALLENGE_TIMEOUT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-orange-500/30 bg-orange-950/40 text-orange-300 text-[10px] font-bold">
            <Clock className="w-3 h-3 text-orange-400" />
            TIMEOUT
          </span>
        );
      case 'UNSUPPORTED_HARDWARE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-purple-500/30 bg-purple-950/40 text-purple-300 text-[10px] font-bold">
            <Cpu className="w-3 h-3 text-purple-400" />
            NO HARDWARE
          </span>
        );
      case 'FAILED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-rose-500/30 bg-rose-950/40 text-rose-300 text-[10px] font-bold">
            <XCircle className="w-3 h-3 text-rose-400" />
            FAILED
          </span>
        );
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'BIOMETRIC_PASSKEY':
      case 'WEBAUTHN_GATE_PROBE':
        return <Fingerprint className="w-4 h-4 text-[#00f2ff]" />;
      case 'GOOGLE_OAUTH':
        return <KeyRound className="w-4 h-4 text-emerald-400" />;
      case 'OPERATOR_OVERRIDE':
        return <Zap className="w-4 h-4 text-amber-400" />;
      default:
        return <Shield className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Sub-view Header & Overview */}
      <div className="p-4 sm:p-5 rounded-xl border border-[#00f2ff22] bg-[#050508bb] backdrop-blur-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg border border-[#00f2ff44] bg-[#00f2ff11] text-[#00f2ff] shadow-[0_0_15px_#00f2ff22] shrink-0 mt-0.5">
            <Fingerprint className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold font-display text-white tracking-widest uppercase">
                WEBAUTHN BIOMETRIC SECURITY LOGS
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-[#00f2ff44] bg-[#00f2ff18] text-[#00f2ff] font-bold">
                AUDIT TRAIL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cryptographic hardware security audit of all WebAuthn gate assertions, biometric passkey authentications, and clearance handshakes.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={handleTestProbe}
            disabled={isProbing}
            className="px-3 py-1.5 rounded border border-[#00f2ff66] bg-[#00f2ff1a] hover:bg-[#00f2ff33] text-[#00f2ff] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_#00f2ff22] disabled:opacity-50"
            title="Execute real-time WebAuthn challenge to test platform authenticator"
          >
            <Fingerprint className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin' : ''}`} />
            <span>{isProbing ? 'QUERYING SENSOR...' : 'TEST WEBAUTHN SENSOR'}</span>
          </button>

          <button
            onClick={refreshLogs}
            className="px-3 py-1.5 rounded border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Refresh authentication log ledger"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>REFRESH</span>
          </button>

          <button
            onClick={handleExportLogs}
            className="px-3 py-1.5 rounded border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Export full log ledger as JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT</span>
          </button>

          <button
            onClick={handleClearLogs}
            className="p-1.5 rounded border border-rose-500/30 bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 text-xs transition cursor-pointer"
            title="Purge logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live Probe Feedback Banner */}
      {probeResult && (
        <div className="p-3 rounded-lg border border-[#00f2ff33] bg-[#00f2ff0d] flex items-center justify-between text-xs text-[#00f2ff] animate-fadeIn">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 shrink-0" />
            <span>{probeResult}</span>
          </div>
          <button
            onClick={() => setProbeResult(null)}
            className="text-slate-400 hover:text-white text-[10px] uppercase font-bold"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 rounded-xl border border-[#00f2ff18] bg-[#050508bb] backdrop-blur-md space-y-1">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3 h-3 text-[#00f2ff]" /> TOTAL ATTEMPTS
          </div>
          <div className="text-xl font-bold font-display text-white">{totalCount}</div>
          <div className="text-[10px] text-slate-500">Recorded sessions</div>
        </div>

        <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-[#050508bb] backdrop-blur-md space-y-1">
          <div className="text-[10px] text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> SUCCESS RATE
          </div>
          <div className="text-xl font-bold font-display text-emerald-300">{successRate}%</div>
          <div className="text-[10px] text-slate-500">{successCount} passed / {failedCount} blocked</div>
        </div>

        <div className="p-3.5 rounded-xl border border-[#00f2ff18] bg-[#050508bb] backdrop-blur-md space-y-1">
          <div className="text-[10px] text-[#00f2ff] uppercase tracking-wider flex items-center gap-1">
            <Fingerprint className="w-3 h-3 text-[#00f2ff]" /> BIOMETRIC PROBES
          </div>
          <div className="text-xl font-bold font-display text-[#00f2ff]">{biometricCount}</div>
          <div className="text-[10px] text-slate-500">Hardware token queries</div>
        </div>

        <div className="p-3.5 rounded-xl border border-[#00f2ff18] bg-[#050508bb] backdrop-blur-md space-y-1">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Cpu className="w-3 h-3 text-purple-400" /> ENCLAVE SENSOR
          </div>
          <div className="text-sm font-bold font-display text-purple-300 truncate">
            {hardwareSupported === true
              ? 'ACTIVE (FIDO2)'
              : hardwareSupported === false
              ? 'EMULATED / SOFT'
              : 'INITIALIZING...'}
          </div>
          <div className="text-[10px] text-slate-500">Platform Authenticator</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-3 rounded-xl border border-[#00f2ff18] bg-[#050508bb]">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search logs by operator, credential, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#090912] border border-[#00f2ff22] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00f2ff]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => {
              if (soundEffects) playSound('click');
              setStatusFilter('ALL');
            }}
            className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
              statusFilter === 'ALL'
                ? 'bg-[#00f2ff] text-black shadow-[0_0_10px_#00f2ff44]'
                : 'bg-[#111122] text-slate-300 hover:bg-[#1a1a2e]'
            }`}
          >
            ALL ({logs.length})
          </button>

          <button
            onClick={() => {
              if (soundEffects) playSound('click');
              setStatusFilter('SUCCESS');
            }}
            className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
              statusFilter === 'SUCCESS'
                ? 'bg-emerald-400 text-black shadow-[0_0_10px_#10b98144]'
                : 'bg-[#111122] text-slate-300 hover:bg-[#1a1a2e]'
            }`}
          >
            SUCCESS ({successCount})
          </button>

          <button
            onClick={() => {
              if (soundEffects) playSound('click');
              setStatusFilter('FAILED');
            }}
            className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
              statusFilter === 'FAILED'
                ? 'bg-rose-500 text-white shadow-[0_0_10px_#f43f5e44]'
                : 'bg-[#111122] text-slate-300 hover:bg-[#1a1a2e]'
            }`}
          >
            FAILED / REJECTED ({failedCount})
          </button>

          <button
            onClick={() => {
              if (soundEffects) playSound('click');
              setStatusFilter('BIOMETRIC_ONLY');
            }}
            className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
              statusFilter === 'BIOMETRIC_ONLY'
                ? 'bg-cyan-400 text-black shadow-[0_0_10px_#06b6d444]'
                : 'bg-[#111122] text-slate-300 hover:bg-[#1a1a2e]'
            }`}
          >
            BIOMETRIC ONLY ({biometricCount})
          </button>
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="rounded-xl border border-[#00f2ff22] bg-[#050508bb] backdrop-blur-md overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Fingerprint className="w-10 h-10 text-slate-600 mx-auto animate-pulse" />
            <div className="text-sm text-slate-400 font-bold">No security events found matching criteria.</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Authenticate via the WebAuthn gate or click &quot;Test WebAuthn Sensor&quot; above to capture real-time security events.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#00f2ff14]">
            {filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const dateObj = new Date(log.timestamp);
              const formattedDate = dateObj.toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const formattedTime = dateObj.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div
                  key={log.id}
                  className={`transition-colors duration-150 ${
                    isExpanded ? 'bg-[#00f2ff08]' : 'hover:bg-[#00f2ff05]'
                  }`}
                >
                  {/* Summary Bar */}
                  <div
                    onClick={() => {
                      if (soundEffects) playSound('click');
                      setExpandedLogId(isExpanded ? null : log.id);
                    }}
                    className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    {/* Left: Icon & Method & Operator */}
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="p-2 rounded-lg border border-[#00f2ff22] bg-[#111122] shrink-0 mt-0.5 sm:mt-0">
                        {getMethodIcon(log.method)}
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white tracking-wide">
                            {log.method === 'BIOMETRIC_PASSKEY'
                              ? 'WebAuthn Biometric Passkey'
                              : log.method === 'WEBAUTHN_GATE_PROBE'
                              ? 'WebAuthn Hardware Probe'
                              : log.method === 'GOOGLE_OAUTH'
                              ? 'Google Workspace OAuth 2.0'
                              : 'Master Operator Override'}
                          </span>
                          {getStatusBadge(log.status)}
                        </div>

                        <div className="text-[11px] text-slate-400 truncate flex items-center gap-2">
                          <span className="text-[#00f2ff]">{log.operatorIdentifier}</span>
                          <span className="text-slate-600">•</span>
                          <span>{log.authenticatorType || 'Hardware Enclave'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Timestamp & Latency & Expand Toggle */}
                    <div className="flex items-center justify-between md:justify-end gap-3 text-xs shrink-0 pl-11 md:pl-0">
                      <div className="text-right">
                        <div className="text-slate-300 text-[11px] font-mono">
                          {formattedTime} <span className="text-slate-500">({formattedDate})</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1.5">
                          <span>Latency: {log.latencyMs}ms</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400">{log.securityTier}</span>
                        </div>
                      </div>

                      <div className="p-1 rounded text-slate-400 hover:text-white">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-[#00f2ff]" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Cryptographic Detail Panel */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 bg-[#040409] border-t border-[#00f2ff11] space-y-3 text-xs animate-fadeIn">
                      <div className="p-3 rounded-lg border border-[#00f2ff18] bg-[#080814] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider">EVENT ID</div>
                          <div className="text-slate-300 font-mono text-[11px] truncate">{log.id}</div>
                        </div>

                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider">RELYING PARTY / DOMAIN</div>
                          <div className="text-[#00f2ff] font-mono text-[11px] truncate">{log.rpId || 'aether-security-core'}</div>
                        </div>

                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider">ORIGIN URI</div>
                          <div className="text-slate-300 font-mono text-[11px] truncate">{log.origin || 'https://aether.internal'}</div>
                        </div>

                        {log.credentialId && (
                          <div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">PUBLIC KEY CREDENTIAL ID</div>
                            <div className="text-emerald-400 font-mono text-[11px] truncate">{log.credentialId}</div>
                          </div>
                        )}

                        {log.challengeHash && (
                          <div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">CHALLENGE CRYPTOGRAPHIC HASH</div>
                            <div className="text-amber-300 font-mono text-[11px] truncate">{log.challengeHash}</div>
                          </div>
                        )}

                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider">USER VERIFICATION STATE</div>
                          <div className="text-slate-300 font-mono text-[11px] uppercase">
                            {log.userVerification || 'verified'}
                          </div>
                        </div>
                      </div>

                      {log.failureReason && (
                        <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs flex items-start gap-2">
                          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-[11px] text-rose-200">ABORT / FAILURE DIAGNOSTIC:</div>
                            <div className="text-[11px] font-mono text-rose-300/90">{log.failureReason}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
