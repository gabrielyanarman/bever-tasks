using Customer_Management.Utilities;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using System;

namespace Customer_Management
{
    public class InventoryProductUpdatedTotalAmountUpdater: IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {
            IPluginExecutionContext context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            IOrganizationServiceFactory serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            IOrganizationService service = serviceFactory.CreateOrganizationService(context.UserId);
            ITracingService tracingService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));

            if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity)
            {
                try
                {
                    Entity inventoryProduct = (Entity)context.InputParameters["Target"];
                    if (inventoryProduct.Contains("new_mon_total_amount"))
                    {
                        Entity oldInventoryProduct = (Entity)context.PreEntityImages["preimage1"];
                        Money ipOldTotalAmount = oldInventoryProduct.GetAttributeValue<Money>("new_mon_total_amount");
                        Money ipNewTotalAmount = inventoryProduct.GetAttributeValue<Money>("new_mon_total_amount");
                        Money totalAmountChange = null;
                        EntityReference inventoryRef = oldInventoryProduct.GetAttributeValue<EntityReference>("new_fk_inventory");
                        
                        if (inventoryRef != null)
                        {
                            Guid inventoryId = inventoryRef.Id;
                            string inventoryLogicName = inventoryRef.LogicalName;

                            if (ipOldTotalAmount.Value > ipNewTotalAmount.Value)
                            {
                                totalAmountChange = new Money(ipOldTotalAmount.Value - ipNewTotalAmount.Value);
                                Helpers.UpdateInventoryTotalAmount(service, Helpers.OperationDecrease, inventoryLogicName, inventoryId, totalAmountChange);
                            }
                            else
                            {
                                totalAmountChange = new Money(ipNewTotalAmount.Value - ipOldTotalAmount.Value);
                                Helpers.UpdateInventoryTotalAmount(service, Helpers.OperationAdd, inventoryLogicName, inventoryId, totalAmountChange);
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    throw new InvalidPluginExecutionException("Error accured in plugin: " + ex.Message);
                }
            }
        }
    }
}
