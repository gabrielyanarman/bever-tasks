using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using System;

namespace Customer_Management.Utilities
{
    public static class Helpers
    {
        public const string OperationAdd = "add";
        public const string OperationDecrease = "decrease";

        public static void UpdateInventoryTotalAmount(IOrganizationService service, string operationType, string inventoryLogicName, Guid inventoryId, Money totalAmountChange)
        {
            Entity inventory = service.Retrieve(inventoryLogicName, inventoryId, new ColumnSet("new_mon_total_amount"));
            Money totalAmount = inventory.GetAttributeValue<Money>("new_mon_total_amount");

            switch (operationType.ToLower())
            {
                case OperationAdd:
                    inventory["new_mon_total_amount"] = new Money((totalAmount?.Value ?? 0) + totalAmountChange.Value);
                    break;

                case OperationDecrease:
                    if (totalAmount != null && totalAmount.Value >= totalAmountChange.Value)
                    {
                        inventory["new_mon_total_amount"] = new Money(totalAmount.Value - totalAmountChange.Value);
                    }
                    else
                    {
                        throw new InvalidOperationException("Insufficient total amount for decrease operation.");
                    }
                    break;

                default:
                    throw new ArgumentException("Invalid operation type.", nameof(operationType));
            }

            service.Update(inventory);
        }
        public static (EntityReference, decimal) getCurrencyFromPriceList(IOrganizationService service, string priceListLogicalName, Guid priceListId)
        {
            Entity priceList = service.Retrieve(priceListLogicalName, priceListId, new ColumnSet("transactioncurrencyid", "exchangerate"));
            EntityReference currencyRef = priceList.GetAttributeValue<EntityReference>("transactioncurrencyid");
            decimal exchangerate = priceList.GetAttributeValue<decimal>("exchangerate");
            if(currencyRef != null)
            {
                return (currencyRef, exchangerate);
            } else
            {
                return (null, 1);
            }
        }
        public static Money getPricePerUnit(IOrganizationService service, Guid productId, Guid priceListId, decimal exchangerate)
        {
            QueryExpression priceListItemQuery = new QueryExpression
            {
                EntityName = "new_price_list_item",
                ColumnSet = new ColumnSet("new_mon_price_per_unit"),
                Criteria =
                {
                    FilterOperator = LogicalOperator.And,
                    Conditions =
                    {
                        new ConditionExpression("new_fk_price_list", ConditionOperator.Equal, priceListId),
                        new ConditionExpression("new_fk_product", ConditionOperator.Equal, productId)
                    }
                }
            };

            EntityCollection priceListItems = service.RetrieveMultiple(priceListItemQuery);
            if(priceListItems.Entities.Count > 0)
            {
                Entity priceListItem = priceListItems.Entities[0];
                Money pricePerUnit = priceListItem.GetAttributeValue<Money>("new_mon_price_per_unit");
                return pricePerUnit;
            } else
            {
                Entity product = service.Retrieve("new_product", productId, new ColumnSet("new_mon_price_per_unit"));
                Money pricePerUnit = product.GetAttributeValue<Money>("new_mon_price_per_unit");
                return new Money(pricePerUnit.Value * exchangerate);
            }
        }
    }
}
