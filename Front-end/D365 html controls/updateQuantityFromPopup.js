function correctId(id) {
  return id.replace("{", "").replace("}", "").toLowerCase();
}

function addOption(dropDown, value, text) {
  const newOption = document.createElement("option");
  newOption.value = value;
  newOption.textContent = text;
  dropDown.appendChild(newOption);
}

function readParameterValues(parameterName) {
  if (location.search != null) {
    if (location.search.split("=")[1] != null) {
      return JSON.parse(decodeURIComponent(location.search.split("=")[1]))[
        parameterName
      ];
    }
  }
}

function getSelectedOption(selectElementId) {
  const selectElement = document.getElementById(selectElementId);
  const selectedOption = selectElement.options[selectElement.selectedIndex];
  const optionValue = selectedOption.value;

  return optionValue;
}

async function updateQuantity() {
  let fetchXml = `
  <fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="true">
    <entity name="new_product">
      <attribute name="new_productid"/>
      <attribute name="new_name"/>
      <attribute name="new_mon_price_per_unit"/>
      <order attribute="new_name" descending="false"/>
      <link-entity name="new_inventory_product" from="new_fk_product" to="new_productid" link-type="outer" alias="ip">
        <attribute name="new_int_quantity"/>
        <attribute name="new_inventory_productid"/>
        <attribute name="new_fk_product"/>
        <attribute name="new_fk_inventory"/>
        <filter type="and">
          <condition attribute="new_fk_inventory" operator="eq" value="${readParameterValues(
            "inventoryId"
          )}"/>
         </filter>
        <link-entity name="new_inventory" from="new_inventoryid" to="new_fk_inventory" link-type="outer" alias="iv">
          <attribute name="new_fk_price_list"/>
          <attribute name="new_inventoryid"/>
          <link-entity name="new_price_list" from="new_price_listid" to="new_fk_price_list" link-type="outer" alias="pl">
            <attribute name="new_price_listid"/>
            <attribute name="transactioncurrencyid"/>
            <link-entity name="new_price_list_item" from="new_fk_price_list" to="new_price_listid" link-type="outer" alias="pi">
              <attribute name="new_mon_price_per_unit"/>
              <attribute name="new_fk_price_list"/>
              <attribute name="new_fk_product"/>
            </link-entity>
          </link-entity>
        </link-entity>
      </link-entity>
    </entity>
  </fetch>
  `;

  fetchXml = "?fetchXml=" + encodeURIComponent(fetchXml);

  try {
    const fetchResult = await parent.Xrm.WebApi.retrieveMultipleRecords(
      "new_product",
      fetchXml
    );

    if (fetchResult === null || !fetchResult.entities.length) return;

    const products = [];
    fetchResult.entities.forEach((item) => {
      let isUnique = true;
      products.forEach((product) => {
        if (product["new_productid"] === item["new_productid"]) {
          isUnique = false;
        }
      });
      if (isUnique) {
        products.push(item);
      }
    });

    const productsDropDown = document.getElementById("products");

    products.forEach((product) => {
      addOption(
        productsDropDown,
        product["new_productid"],
        product["new_name"]
      );
    });

    const popupForm = document.getElementById("popupForm");
    const inputElement = document.getElementById("quantity");
    const cancelButton = document.getElementById("cancelButton");

    cancelButton.addEventListener("click", () => {
      window.close();
    });

    popupForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const [selectedProductId, selectedOperationValue, inputQuantity] = [
        getSelectedOption("products"),
        getSelectedOption("operations"),
        +inputElement.value,
      ];

      if (
        !selectedProductId ||
        !selectedOperationValue ||
        !inputQuantity ||
        inputQuantity < 0
      ) {
        alert("incorrect data");
        return;
      }
      const existingProductInInventory = fetchResult.entities.filter(
        (product) =>
          product["new_productid"] === selectedProductId &&
          product["ip.new_fk_inventory"] ===
            correctId(readParameterValues("inventoryId"))
      )[0];

      const priceListCurrency = await parent.Xrm.WebApi.retrieveRecord(
        "new_price_list",
        correctId(readParameterValues("priceListId"))
      );

      // if we try to reduce the quantity of a product that is out of stock
      if (!existingProductInInventory && selectedOperationValue === "0") {
        alert("This product doesn't exist");
        return;
      }

      // if we try to reduce the amount of product that is available
      if (existingProductInInventory && selectedOperationValue === "0") {
        const existingQuantity =
          existingProductInInventory["ip.new_int_quantity"];

        if (existingQuantity < inputQuantity) {
          alert("Тhere is not that much in inventory");
          return;
        } else if (existingQuantity === inputQuantity) {
          await parent.Xrm.WebApi.deleteRecord(
            "new_inventory_product",
            existingProductInInventory["ip.new_inventory_productid"]
          );
        } else {
          const updatedQuantity =
            existingProductInInventory["ip.new_int_quantity"] - inputQuantity;

          const productExistingInPriceList = fetchResult.entities.filter(
            (item) => item["pi.new_fk_product"] === correctId(selectedProductId)
          );

          let pricePerUnit;
          if (!productExistingInPriceList.length) {
            pricePerUnit =
              existingProductInInventory["new_mon_price_per_unit"] *
              priceListCurrency["exchangerate"];
          } else {
            pricePerUnit =
              +productExistingInPriceList[0]["pi.new_mon_price_per_unit"];
          }

          const data = {
            ["new_int_quantity"]: updatedQuantity,
            ["new_mon_total_amount"]: pricePerUnit * updatedQuantity,
          };

          await parent.Xrm.WebApi.updateRecord(
            "new_inventory_product",
            existingProductInInventory["ip.new_inventory_productid"],
            data
          );
        }
      }

      // if we try to add a quantity of a product that is not in inventory
      if (!existingProductInInventory && selectedOperationValue === "1") {
        const product = products.filter(
          (item) => item["new_productid"] === selectedProductId
        )[0];

        const currencyId = priceListCurrency["_transactioncurrencyid_value"];

        const productExistingInPriceList = fetchResult.entities.filter(
          (item) => item["pi.new_fk_product"] === correctId(selectedProductId)
        );

        let pricePerUnit;
        if (!productExistingInPriceList.length) {
          pricePerUnit =
            product["new_mon_price_per_unit"] *
            priceListCurrency["exchangerate"];
        } else {
          pricePerUnit =
            +productExistingInPriceList[0]["pi.new_mon_price_per_unit"];
        }

        const data = {
          ["new_name"]: product["new_name"],
          ["new_fk_inventory@odata.bind"]: `/new_inventories(${correctId(
            readParameterValues("inventoryId")
          )})`,
          ["new_fk_product@odata.bind"]: `/new_products(${product["new_productid"]})`,
          ["transactioncurrencyid@odata.bind"]: `/transactioncurrencies(${correctId(
            currencyId
          )})`,
          ["new_int_quantity"]: inputQuantity,
          ["new_mon_price_per_unit"]: pricePerUnit,

          ["new_mon_total_amount"]: inputQuantity * pricePerUnit,
        };

        await parent.Xrm.WebApi.createRecord("new_inventory_product", data);
      }

      // if we try to add a quantity of a product that is exist in inventory
      if (existingProductInInventory && selectedOperationValue === "1") {
        const updatedQuantity =
          existingProductInInventory["ip.new_int_quantity"] + inputQuantity;

        const productExistingInPriceList = fetchResult.entities.filter(
          (item) => item["pi.new_fk_product"] === correctId(selectedProductId)
        );
        let pricePerUnit;
        if (!productExistingInPriceList.length) {
          pricePerUnit =
            existingProductInInventory["new_mon_price_per_unit"] *
            priceListCurrency["exchangerate"];
        } else {
          pricePerUnit =
            +productExistingInPriceList[0]["pi.new_mon_price_per_unit"];
        }

        const data = {
          ["new_int_quantity"]: updatedQuantity,
          ["new_mon_total_amount"]: updatedQuantity * pricePerUnit,
        };
        await parent.Xrm.WebApi.updateRecord(
          "new_inventory_product",
          existingProductInInventory["ip.new_inventory_productid"],
          data
        );
      }
      window.close();
    });
  } catch (error) {
    console.error(error);
  }
}

updateQuantity();
