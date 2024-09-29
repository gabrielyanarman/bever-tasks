using Microsoft.Xrm.Sdk;
using System;
using Work_Order_Management.Utilities;

namespace Work_Order_Management
{
    public class AddBookingConflictChecker: IPlugin
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
                    Entity newBooking = (Entity)context.InputParameters["Target"];
                    EntityReference resourceRef = newBooking.GetAttributeValue<EntityReference>("new_fk_resource");
                    DateTime startDate = newBooking.GetAttributeValue<DateTime>("new_dt_start_date");
                    DateTime endDate = newBooking.GetAttributeValue<DateTime>("new_dt_end_date");
                    if (startDate == DateTime.MinValue) throw new InvalidPluginExecutionException("Start date not specified.");
                    if (endDate == DateTime.MinValue) throw new InvalidPluginExecutionException("End date not specified.");
                    if (resourceRef != null)
                    {
                        Guid resourceId = resourceRef.Id;
                        bool isResourceAvailable = Helpers.isResourceAvailable(service, resourceId, startDate, endDate);
                        if(!isResourceAvailable)
                        {
                            throw new InvalidPluginExecutionException("This resource is busy during the specified time period.");
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
