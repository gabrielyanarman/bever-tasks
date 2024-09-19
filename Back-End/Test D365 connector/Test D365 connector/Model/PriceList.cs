using System;

namespace Test_D365_connector.Model
{
    internal class PriceList
    {
        public Guid transactionCurrencyId {  get; set; }
        public decimal exchangerate {  get; set; }
    }
}
