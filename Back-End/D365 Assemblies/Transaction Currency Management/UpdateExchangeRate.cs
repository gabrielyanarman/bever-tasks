using Microsoft.Xrm.Sdk.Workflow;
using Microsoft.Xrm.Sdk;
using System;
using System.Activities;
using Transaction_Currency_Management.Utilities;

namespace Transaction_Currency_Management
{
    public class UpdateExchangeRate : CodeActivity
    {
        [Input("currencyRef")]
        [ReferenceTarget("transactioncurrency")]
        public InArgument<EntityReference> CurrencyRef { get; set; }
        protected override void Execute(CodeActivityContext executionContext)
        {
            IWorkflowContext context = executionContext.GetExtension<IWorkflowContext>();
            IOrganizationServiceFactory serviceFactory = executionContext.GetExtension<IOrganizationServiceFactory>();
            IOrganizationService service = serviceFactory.CreateOrganizationService(context.UserId);
            ITracingService tracingService = executionContext.GetExtension<ITracingService>();
            IExecutionContext crmContext = executionContext.GetExtension<IExecutionContext>();

            try
            {
                EntityReference currencyRef = CurrencyRef.Get(executionContext);
                if (currencyRef == null) return;
                Guid currencyId = currencyRef.Id;
                decimal usdRate = Helpers.GetUsdRate();
                Helpers.UpdateUsdRateInTransactioncurrency(service, usdRate, currencyId);
            }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException(ex.Message);
            }
        }
    }
}
