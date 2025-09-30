<script lang="ts">
  import {
    betaString,
    fixLocalLanguage,
    fixMarket,
    isMarketInBeta,
  } from "$lib/convertLink";
  import { regexWorkflow } from "$lib/storage";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = HTMLAttributes<EventTarget>;

  const props: Props = $props();

  function determineDisclosure(
    marketPath: string,
    marketLocalLangPart: string,
    acc = false,
  ) {
    const disclosureLibrary = `/site-wide-content/${
      acc ? "acc-" : ""
    }disclosure-library`;

    return marketPath + marketLocalLangPart + disclosureLibrary;
  }

  const matchWorkflow = regexWorkflow.exec(location.href);
  if (!matchWorkflow) {
    throw new Error("Regex not matched workflow");
  }

  const [, , market, localLanguageLeft, localLanguageRight] = matchWorkflow;

  let marketFixed = fixMarket(market.toLowerCase());

  // ?? will prevent undefined appear in string
  let localLanguage = (localLanguageLeft ?? localLanguageRight).toLowerCase();

  const wrongMarkets = ["da", "cs", "el"];
  const ifWrongMarket = !!wrongMarkets.some(
    (wrongMarket) => marketFixed === wrongMarket,
  );

  if (ifWrongMarket) {
    [marketFixed, localLanguage] = [localLanguage, marketFixed];
  }

  const beta = isMarketInBeta(marketFixed);

  const marketPath = `/content/guxeu${betaString(beta)}/${marketFixed}`;
  const marketLocalLangPart = `/${fixLocalLanguage(localLanguage, marketFixed, true) || marketFixed}_${marketFixed}`;

  const betaButAcc = ["es", "it"];
  const betaButAccBool = betaButAcc.some((mar) => marketFixed?.includes(mar));

  const addDisclosure = determineDisclosure(
    marketPath,
    marketLocalLangPart,
    betaButAccBool,
  );

  const addAccDisclosure =
    !beta && determineDisclosure(marketPath, marketLocalLangPart, true);

  const marketConfigPart = "/configuration/market-configuration";
  const addMarketConfig = marketPath + marketConfigPart;
</script>

<div {...props} class="fixedLinksContainer">
  {#if addAccDisclosure}
    <a href="/cf#{addAccDisclosure}.html" target="_blank" rel="noreferrer"
      >{addAccDisclosure}</a
    >
  {/if}

  {#if addDisclosure}
    <a href="/cf#{addDisclosure}.html" target="_blank" rel="noreferrer"
      >{addDisclosure}</a
    >
  {/if}

  {#if addMarketConfig}
    <a href="/cf#{addMarketConfig}.html" target="_blank" rel="noreferrer"
      >{addMarketConfig}</a
    >
  {/if}
</div>

<style lang="scss">
  div.fixedLinksContainer {
    display: flex;
    flex-direction: column;
    width: fit-content;
  }
</style>
