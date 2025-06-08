
# Gnosis Safe Deployment Instructions

## Primary Treasury Safe (3-of-5)
Owners: 0x7FA50da5a8f998c9184E344279b205DE699Aa672, 0x12235bd88Cd72bf543f80651ECe29a3451FC25d3, 0xCeC896C5704ad18f4Ba966a87753F771D3c909AF, 0x122Eecb796a6eFF8846E32902a8467f6e5288d92, 0x6b9217b8f303B7CF8E3299D8073D9C6239389ae0
Threshold: 3
Salt Nonce: ddedaafccc6c4aa69e6ccf029fcb61b2081d1be123f5bac7ae9439d21d0009a0

## Emergency Reserve Safe (4-of-5)
Owners: 0x28D42d7Eb6F5f1e98E4404e69637e877F7010737, 0x0b148B80d5f2b7e575cE41F823b3e8B3A5f84857, 0x0AEb933FADb49ae52Dc2Fd2fd1cEEee472644C54, 0x6B0004D925c2B7acbd10E90cf98Ef98b998A43b0, 0x1FB2f1de72c2330952489D2dc7DB5e4400DEEc2b
Threshold: 4
Salt Nonce: 0bd4b4d3be1b750501529c422fe00e2a5ec734c5cb3ec28ec8de19e25b1fb341

## Deployment Steps:
1. Go to https://app.safe.global/
2. Connect wallet with sufficient ETH for deployment
3. Create new Safe with the above parameters
4. Save the Safe addresses in treasury-addresses.json
5. Test multi-sig functionality before use

## Security Checklist:
- [ ] Verify all owner addresses are correct
- [ ] Test transaction signing with required threshold
- [ ] Backup all private keys securely
- [ ] Document key holder responsibilities
- [ ] Set up monitoring for all treasury wallets
