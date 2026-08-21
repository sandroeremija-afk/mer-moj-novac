(function exposeMerBankProviders(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MerBankProviders = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMerBankProviders() {
  const providers = [
    {
      id: 'revolut-demo',
      name: 'Revolut',
      region: 'EU Open Banking · Demo',
      color: '#0075eb',
      accounts: [
        { id: 'rev-eur-4821', name: 'Revolut EUR', mask: '••4821', kind: 'Tekući račun', kindEn: 'Current account', iban:'LT121000011101001000', bic:'REVOLT21', currency:'EUR' },
        { id: 'rev-visa-1189', name: 'Revolut Visa', mask: '••1189', kind: 'Kartica', kindEn: 'Card', iban:'LT121000011101001000', bic:'REVOLT21', currency:'EUR' }
      ]
    },
    {
      id: 'pbz-demo',
      name: 'PBZ',
      region: 'PSD2 Open Banking · Demo',
      color: '#0d4c92',
      accounts: [
        { id: 'pbz-current-7730', name: 'PBZ tekući', mask: '••7730', kind: 'Tekući račun', kindEn: 'Current account', iban:'HR1210010051863000160', bic:'PBZGHR2X', currency:'EUR' },
        { id: 'pbz-business-2204', name: 'PBZ poslovni', mask: '••2204', kind: 'Poslovni račun', kindEn: 'Business account', iban:'HR5623400091110001234', bic:'PBZGHR2X', currency:'EUR' }
      ]
    }
  ];

  const ledgers = {
    'rev-eur-4821': [
      { id: 'rev-1001', bookedAt: '2026-08-20', amount: -18.40, description: 'UBER *TRIP ZAGREB' },
      { id: 'rev-1002', bookedAt: '2026-08-20', amount: -63.28, description: 'KONZUM SUPERMARKET' },
      { id: 'rev-1003', bookedAt: '2026-08-18', amount: 850, description: 'UPWORK FREELANCE PAYMENT' },
      { id: 'rev-1004', bookedAt: '2026-08-17', amount: -12.60, description: 'POS 4921 NOVA USLUGA' }
    ],
    'rev-visa-1189': [
      { id: 'rev-card-401', bookedAt: '2026-08-20', amount: -9.99, description: 'SPOTIFY AB' },
      { id: 'rev-card-402', bookedAt: '2026-08-19', amount: -34.50, description: 'WOLT ZAGREB' }
    ],
    'pbz-current-7730': [
      { transactionId: 'pbz-7001', bookingDate: '2026-08-20', transactionAmount: { amount: '4300.00' }, creditDebitIndicator: 'CRDT', remittanceInformationUnstructured: 'PLAĆA KOLOVOZ' },
      { transactionId: 'pbz-7002', bookingDate: '2026-08-20', transactionAmount: { amount: '45.90' }, creditDebitIndicator: 'DBIT', remittanceInformationUnstructured: 'INA MALOPRODAJA' },
      { transactionId: 'pbz-7003', bookingDate: '2026-08-19', transactionAmount: { amount: '189.00' }, creditDebitIndicator: 'DBIT', remittanceInformationUnstructured: 'AMAZON EU SARL' },
      { transactionId: 'pbz-7004', bookingDate: '2026-08-18', transactionAmount: { amount: '27.00' }, creditDebitIndicator: 'DBIT', remittanceInformationUnstructured: 'POS 006428 OSTALO' }
    ],
    'pbz-business-2204': [
      { id: 'pbz-b-901', bookedAt: '2026-08-20', amount: 1250, description: 'CLIENT PAYMENT INV-440' },
      { id: 'pbz-b-902', bookedAt: '2026-08-20', amount: -24.99, description: 'ADOBE SOFTWARE' },
      { id: 'pbz-b-903', bookedAt: '2026-08-18', amount: -130, description: 'GOOGLE ADS MARKETING' }
    ]
  };

  const clone = value => JSON.parse(JSON.stringify(value));

  function getProviders() { return clone(providers); }

  function getProvider(providerId) { return providers.find(provider => provider.id === providerId) || null; }

  function createConnection(providerId, accountId, profileId, timestamp = Date.now()) {
    const provider = getProvider(providerId);
    const account = provider?.accounts.find(item => item.id === accountId);
    if (!provider || !account) throw providerError('INVALID_ACCOUNT', 'The selected demo account is unavailable.');
    return {
      id: `connection-${providerId}-${accountId}-${timestamp}`,
      providerId,
      institution: provider.name,
      accountId,
      accountName: account.name,
      accountMask: account.mask,
      accountKind: account.kind,
      accountKindEn: account.kindEn,
      iban: account.iban,
      bic: account.bic,
      currency: account.currency,
      profileId: profileId === 'business' ? 'business' : 'personal',
      status: 'connected',
      tokenState: 'active',
      cursor: 0,
      createdAt: new Date(timestamp).toISOString(),
      lastSyncedAt: null,
      lastAttemptAt: null,
      lastErrorCode: null
    };
  }

  function providerError(code, message, retryAfterSeconds = null) {
    const error = new Error(message);
    error.code = code;
    if (retryAfterSeconds !== null) error.retryAfterSeconds = retryAfterSeconds;
    return error;
  }

  async function fetchTransactions(connection, options = {}) {
    const now = Number(options.now ?? Date.now());
    if (!connection || connection.status === 'disconnected') throw providerError('DISCONNECTED', 'The bank connection has been disconnected.');
    if (connection.tokenState === 'expired' || (connection.tokenExpiresAt && new Date(connection.tokenExpiresAt).getTime() <= now)) throw providerError('TOKEN_EXPIRED', 'The bank authorization has expired.');
    if (connection.rateLimitUntil && new Date(connection.rateLimitUntil).getTime() > now) {
      const seconds = Math.max(1, Math.ceil((new Date(connection.rateLimitUntil).getTime() - now) / 1000));
      throw providerError('RATE_LIMITED', 'The bank requested a short pause before the next sync.', seconds);
    }
    if (connection.lastAttemptAt && now - new Date(connection.lastAttemptAt).getTime() < 5000) {
      throw providerError('RATE_LIMITED', 'The bank requested a short pause before the next sync.', 5);
    }
    const ledger = ledgers[connection.accountId];
    if (!ledger) throw providerError('DISCONNECTED', 'The linked account is no longer available.');
    connection.lastAttemptAt = new Date(now).toISOString();
    const cursor = Math.max(0, Number(connection.cursor) || 0);
    return {
      transactions: clone(ledger.slice(cursor)),
      nextCursor: ledger.length,
      fetchedAt: new Date(now).toISOString()
    };
  }

  function renewConnection(connection) {
    if (!connection) return null;
    connection.status = 'connected';
    connection.tokenState = 'active';
    connection.tokenExpiresAt = null;
    connection.rateLimitUntil = null;
    connection.lastAttemptAt = null;
    connection.lastErrorCode = null;
    return connection;
  }

  return { getProviders, getProvider, createConnection, fetchTransactions, renewConnection, providerError };
});
