using Microsoft.Xrm.Sdk;
using System;

namespace Test_D365_connector.Model
{
    internal class InventoryProduct
    {
        public Guid inventoryProductId {get; set;}
        public int quantity {  get; set; }
        public Money pricePerUnit { get; set; }
    }
}
