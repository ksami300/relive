const normalizeBaseUrl = (value?: string) => (value || "").replace(/\/+$/, "");

export const API_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === "development" ? "http://localhost:4000" : "")
);

export const SOCKET_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_SOCKET_URL || API_URL || (process.env.NODE_ENV === "development" ? "http://localhost:4000" : "")
);

const getHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const getApiUrl = (path: string) => {
  if (!API_URL) {
    throw new Error("Backend URL nije konfigurisan. Postavi NEXT_PUBLIC_API_URL.");
  }
  return `${API_URL}${path}`;
};

const handleUnauthorizedBypass = () => {
  if (typeof window !== "undefined") {
    console.error("🚨 [SISTEMSKI BEZBEDNOSNI PREKID] Token je nevažeći ili je sesija istekla. Izbacujem korisnika...");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login";
  }
};

export const loginKorisnika = async (email: string, password: string): Promise<any> => {
  try {
    const response = await fetch(getApiUrl("/api/relieve/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const resData = await response.json();
    if (!response.ok) throw new Error(resData?.message || "Neuspesna autorizacija.");

    if (resData?.success && resData?.data?.token) {
      localStorage.setItem("token", resData.data.token);
      if (resData.data.refreshToken) localStorage.setItem("refreshToken", resData.data.refreshToken);
    }
    return resData;
  } catch (error: any) {
    throw error;
  }
};

export const registracijaKorisnika = async (email: string, password: string, name: string): Promise<any> => {
  try {
    const response = await fetch(getApiUrl("/api/relieve/auth/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    return await response.json();
  } catch (error: any) {
    throw error;
  }
};

export const posaljiStresPulsSaAmortizerom = async (stressLevel: number): Promise<any> => {
  try {
    const response = await fetch(getApiUrl("/api/relieve/stress/log"), {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ stressLevel }),
    });

    if (response.status === 401) {
      handleUnauthorizedBypass();
      throw new Error("Sesija je istekla.");
    }

    return await response.json();
  } catch (error: any) {
    throw error;
  }
};

export const preuzmiIskoriscenostSedistaB2B = async (organizationId: number): Promise<any> => {
  try {
    const response = await fetch(getApiUrl(`/api/relieve/corporate/${organizationId}/billing/usage`), {
      method: "GET",
      headers: getHeaders(),
    });

    if (response.status === 401) {
      handleUnauthorizedBypass();
      throw new Error("Sesija je istekla.");
    }

    return await response.json();
  } catch (error: any) {
    throw error;
  }
};

export const preuzmiKorporativniScorecard = async (organizationId: number): Promise<any> => {
  try {
    const response = await fetch(getApiUrl(`/api/relieve/corporate/${organizationId}/scorecard`), {
      method: "GET",
      headers: getHeaders(),
    });

    if (response.status === 401) {
      handleUnauthorizedBypass();
      throw new Error("Sesija je istekla.");
    }

    return await response.json();
  } catch (error: any) {
    throw error;
  }
};

export const promeniKapacitetSedistaZaposlenih = async (organizationId: number, seatQuantity: number): Promise<any> => {
  try {
    const response = await fetch(getApiUrl(`/api/relieve/corporate/organizations/${organizationId}/seats`), {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ seatQuantity: Number(seatQuantity) }),
    });

    if (response.status === 401) {
      handleUnauthorizedBypass();
      throw new Error("Sesija je istekla.");
    }

    return await response.json();
  } catch (error: any) {
    throw error;
  }
};

export const preuzmiDnevnuInteligenciju = async (): Promise<any> => {
  return { success: true, data: { status: "MOCK_ACTIVE" } };
};

export const preuzmiBatchDashboardTelemetriju = async (): Promise<any> => {
  return { success: true, data: [] };
};

export const pokreniB2BIntervencijuKlijent = async (organizationId: number, type: string, cohort: string): Promise<any> => {
  try {
    const response = await fetch(getApiUrl(`/api/relieve/corporate/${organizationId}/interventions`), {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ type, cohort }),
    });

    if (response.status === 401) {
      handleUnauthorizedBypass();
      throw new Error("Sesija je istekla.");
    }

    return await response.json();
  } catch (error: any) {
    throw error;
  }
};

export const preuzmiAktivneIntervencijeKlijent = async (organizationId: number): Promise<any> => {
  try {
    const response = await fetch(getApiUrl(`/api/relieve/corporate/${organizationId}/interventions/active`), {
      method: "GET",
      headers: getHeaders(),
    });

    if (response.status === 401) {
      handleUnauthorizedBypass();
      throw new Error("Sesija je istekla.");
    }

    return await response.json();
  } catch (error: any) {
    throw error;
  }
};

export async function preuzmiStatusIntegracijeKlijent() {
  const res = await fetch(getApiUrl("/api/relieve/integrations/status"), {
    headers: getHeaders(),
  });
  return await res.json();
}

export async function promeniPristanakBiometrijeKlijent(granted: boolean) {
  const res = await fetch(getApiUrl("/api/relieve/integrations/consent"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getHeaders(),
    },
    body: JSON.stringify({ granted }),
  });
  return await res.json();
}

export async function pokreniRucniBatchSyncKlijent() {
  const res = await fetch(getApiUrl("/api/relieve/integrations/batch"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getHeaders(),
    },
    body: JSON.stringify({
      events: [
        { source: "FITBIT", timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), heartRate: 84, hrv: 41, sleepMinutes: 420 },
        { source: "FITBIT", timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), heartRate: 89, hrv: 39, sleepMinutes: 420 },
      ],
    }),
  });
  return await res.json();
}
