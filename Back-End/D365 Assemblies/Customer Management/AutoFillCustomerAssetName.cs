using Customer_Management.Utilities;
using Microsoft.Xrm.Sdk;
using System;

namespace Customer_Management
{
    public class AutoFillCustomerAssetName: IPlugin
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
                    Entity customerAsset = (Entity)context.InputParameters["Target"];
                    EntityReference customerRef = customerAsset.GetAttributeValue<EntityReference>("new_fk_account");
                    if(customerRef != null)
                    {
                        Guid customerId = customerRef.Id;
                        string customerAssetName = Helpers.GetCustomerAssetNameAndUpdateAssetNumber(service, customerId);
                        customerAsset["new_name"] = customerAssetName;
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
