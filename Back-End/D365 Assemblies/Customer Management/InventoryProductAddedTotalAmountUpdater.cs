using Customer_Management.Utilities;
using Microsoft.Xrm.Sdk;
using System;

namespace Customer_Management
{
    public class InventoryProductAddedTotalAmountUpdater : IPlugin
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
                        Money ipTotalAmount = inventoryProduct.GetAttributeValue<Money>("new_mon_total_amount");
                        EntityReference inventoryRef = inventoryProduct.GetAttributeValue<EntityReference>("new_fk_inventory");
                        if (inventoryRef != null)
                        {
                            Guid inventoryId = inventoryRef.Id;
                            string inventoryLogicName = inventoryRef.LogicalName;
                            Helpers.UpdateInventoryTotalAmount(service, Helpers.OperationAdd, inventoryLogicName, inventoryId, ipTotalAmount);
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
