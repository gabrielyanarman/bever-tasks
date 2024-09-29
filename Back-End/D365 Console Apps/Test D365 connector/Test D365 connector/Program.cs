using Microsoft.Xrm.Sdk;
using System;
using Test_D365_connector.Model;
using Test_D365_connector.Utilities;

namespace Test_D365_connector
{
    internal class Program
    {
        static void Main(string[] args)
        {
            try
            {
                D365Connector d365Connector = new D365Connector("armangabrielyan@microdev08.onmicrosoft.com", "A123456789a#", "https://micro08.api.crm5.dynamics.com/api/data/v9.2/");
                Console.WriteLine("Successfully connected to D365.");
                Console.WriteLine("Please enter inventory name");
                string inventoryName = Console.ReadLine();
                Console.WriteLine("Please enter product name");
                string productName = Console.ReadLine();
                Console.WriteLine("Please enter quantity");
                string quantity = Console.ReadLine();
                if (!int.TryParse(quantity, out _))
                {
                    Console.WriteLine("The input is not a valid number.");
                    return;
                }
                Console.WriteLine("Pleas enter type of operation");
                string operationType = Console.ReadLine();
                if(!string.Equals(operationType, "Addition", StringComparison.OrdinalIgnoreCase) && !string.Equals(operationType, "Subtraction", StringComparison.OrdinalIgnoreCase))
                {
                    Console.WriteLine("The operation type is incorrect.");
                    return;
                }

                Guid inventoryId = Guid.Empty;
                Inventory inventory = d365Connector.getInventoryFromName(inventoryName);
                if(inventory != null)
                {
                    inventoryId = inventory.inventoryId;
                }

                Guid productId = Guid.Empty;
                Product product = d365Connector.getProductFromName(productName);
                if (product != null)
                {
                    productId = product.productId;
                }

                InventoryProduct inventoryProduct = d365Connector.getInventoryProduct(inventoryId, productId);
                PriceListItem priceListItem = d365Connector.getFoundedPriceListItem(inventory.inventoryPriceListId, productId);
                PriceList priceList = d365Connector.getPriceListFromId(inventory.inventoryPriceListId);

                if(inventoryProduct == null)
                {
                    if(string.Equals(operationType, "Addition", StringComparison.OrdinalIgnoreCase))
                    {
                        Entity newInventoryProduct = new Entity("new_inventory_product");
                        newInventoryProduct["new_name"] = product.productName;
                        newInventoryProduct["new_fk_inventory"] = new EntityReference("new_inventory", inventoryId);
                        newInventoryProduct["new_fk_product"] = new EntityReference("new_product", productId); ;
                        newInventoryProduct["transactioncurrencyid"] = new EntityReference("transactioncurrency", priceList.transactionCurrencyId);
                        newInventoryProduct["new_int_quantity"] = int.Parse(quantity);
                        if (priceListItem != null)
                        {
                            newInventoryProduct["new_mon_price_per_unit"] = priceListItem.pricePerUnit;
                            newInventoryProduct["new_mon_total_amount"] = new Money(int.Parse(quantity) * priceListItem.pricePerUnit.Value);
                        }
                        else
                        {
                            newInventoryProduct["new_mon_price_per_unit"] = new Money(product.defaultPricePerUnit.Value * priceList.exchangerate);
                            newInventoryProduct["new_mon_total_amount"] = new Money(int.Parse(quantity) * product.defaultPricePerUnit.Value * priceList.exchangerate);
                        }
                        d365Connector.createInventoryProduct(newInventoryProduct);
                    }
                    else
                    {
                        Console.WriteLine("The product is not in inventory.");
                    }
                }

                if(inventoryProduct != null)
                {
                    if (string.Equals(operationType, "Addition", StringComparison.OrdinalIgnoreCase))
                    {
                        Entity newInventoryProduct = new Entity("new_inventory_product");
                        newInventoryProduct.Id = inventoryProduct.inventoryProductId;
                        int totalQuantity = int.Parse(quantity) + inventoryProduct.quantity;
                        newInventoryProduct["new_int_quantity"] = totalQuantity;
                        newInventoryProduct["new_mon_total_amount"] = new Money(totalQuantity * inventoryProduct.pricePerUnit.Value);
                        d365Connector.updateInventoryProduct(newInventoryProduct);
                    }
                    else
                    {
                        if (int.Parse(quantity) < inventoryProduct.quantity)
                        {
                            Entity newInventoryProduct = new Entity("new_inventory_product");
                            newInventoryProduct.Id = inventoryProduct.inventoryProductId;
                            int totalQuantity = inventoryProduct.quantity - int.Parse(quantity);
                            newInventoryProduct["new_int_quantity"] = totalQuantity;
                            newInventoryProduct["new_mon_total_amount"] = new Money(totalQuantity * inventoryProduct.pricePerUnit.Value);
                            d365Connector.updateInventoryProduct(newInventoryProduct);
                        }
                        else if(int.Parse(quantity) == inventoryProduct.quantity)
                        {
                            d365Connector.deleteInventoryProduct(inventoryProduct.inventoryProductId);
                        }
                        else
                        {
                            Console.Write("There is not enough stock for this product in the inventory");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Strange error occured: " + ex.Message);
            }
        }
    } 
}
