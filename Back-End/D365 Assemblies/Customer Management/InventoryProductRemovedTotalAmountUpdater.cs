using Customer_Management.Utilities;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using System;

namespace Customer_Management
{
    public class InventoryProductRemovedTotalAmountUpdater : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {
            IPluginExecutionContext context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            IOrganizationServiceFactory serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            IOrganizationService service = serviceFactory.CreateOrganizationService(context.UserId);
            ITracingService tracingService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));
            if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is EntityReference)
            {
                try
                {
                    EntityReference inventoryProductRef = (EntityReference)context.InputParameters["Target"];
                    Entity inventoryProduct = service.Retrieve(inventoryProductRef.LogicalName, inventoryProductRef.Id, new ColumnSet("new_fk_inventory", "new_mon_total_amount"));

                    Money ipTotalAmount = inventoryProduct.GetAttributeValue<Money>("new_mon_total_amount");
                    EntityReference inventoryRef = inventoryProduct.GetAttributeValue<EntityReference>("new_fk_inventory");
                    if (inventoryRef != null)
                    {
                        Guid inventoryId = inventoryRef.Id;
                        string inventoryLogicalName = inventoryRef.LogicalName;
                        Helpers.UpdateInventoryTotalAmount(service, Helpers.OperationDecrease, inventoryLogicalName, inventoryId, ipTotalAmount);
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
