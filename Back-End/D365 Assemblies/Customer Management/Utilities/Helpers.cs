using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using System;

namespace Customer_Management.Utilities
{
    public static class Helpers
    {
        public static string GetCustomerAssetNameAndUpdateAssetNumber(IOrganizationService service, Guid customerId)
        {
            Entity myAccount = service.Retrieve("new_my_accounts", customerId, new ColumnSet("new_name", "new_int_asset_number"));
            int assetNumber = myAccount.GetAttributeValue<int>("new_int_asset_number");
            string accountName = myAccount.GetAttributeValue<string>("new_name");
            myAccount.Attributes.Clear();
            if (assetNumber == 0) assetNumber++;
            myAccount["new_int_asset_number"] = assetNumber + 1;
            service.Update(myAccount);

            if (assetNumber < 10)
            {
                return accountName + "-000" + Convert.ToString(assetNumber);
            }
            else if (assetNumber > 10 && assetNumber < 100)
            {
                return accountName + "-00" + Convert.ToString(assetNumber);
            } else if (assetNumber > 100 && assetNumber < 1000)
            {
                return accountName + "-0" + Convert.ToString(assetNumber);
            } else
            {
                return accountName + "-" + Convert.ToString(assetNumber);
            }
        }
    }
}
