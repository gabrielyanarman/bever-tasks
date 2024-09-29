using Microsoft.Xrm.Sdk;
using System;

namespace Test_D365_connector.Model
{
    internal class Inventory
    {
        public Guid inventoryId {  get; set; }
        public Guid inventoryPriceListId { get; set; }
    }
}
