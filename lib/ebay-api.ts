// eBay API integration for live resale listings
export class EbayAPI {
  private clientId: string
  private clientSecret: string
  private accessToken: string | null = null

  constructor() {
    this.clientId = process.env.EBAY_CLIENT_ID!
    this.clientSecret = process.env.EBAY_CLIENT_SECRET!
  }

  async authenticate() {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64")

    const response = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
    })

    const data = await response.json()
    this.accessToken = data.access_token
    return this.accessToken
  }

  async createListing(item: {
    title: string
    description: string
    price: number
    category: string
    images: string[]
    condition: string
  }) {
    if (!this.accessToken) {
      await this.authenticate()
    }

    const listingData = {
      Item: {
        Title: item.title,
        Description: item.description,
        StartPrice: item.price,
        CategoryID: item.category,
        PictureDetails: {
          PictureURL: item.images,
        },
        ConditionID: this.getConditionId(item.condition),
        ListingDuration: "Days_7",
        ListingType: "FixedPriceItem",
        Currency: "USD",
      },
    }

    try {
      const response = await fetch("https://api.ebay.com/ws/api.dll", {
        method: "POST",
        headers: {
          "X-EBAY-API-SITEID": "0",
          "X-EBAY-API-COMPATIBILITY-LEVEL": "967",
          "X-EBAY-API-CALL-NAME": "AddFixedPriceItem",
          "X-EBAY-API-IAF-TOKEN": this.accessToken!,
          "Content-Type": "text/xml",
        },
        body: this.buildXMLRequest(listingData),
      })

      const xmlResponse = await response.text()
      return this.parseXMLResponse(xmlResponse)
    } catch (error) {
      console.error("eBay listing error:", error)
      throw error
    }
  }

  private getConditionId(condition: string): string {
    const conditionMap: { [key: string]: string } = {
      New: "1000",
      "Like New": "1500",
      Excellent: "2000",
      "Very Good": "2500",
      Good: "3000",
      Acceptable: "4000",
    }
    return conditionMap[condition] || "3000"
  }

  private buildXMLRequest(data: any): string {
    const item = data.Item
    let pictureUrlsXml = ""
    if (item.PictureDetails && item.PictureDetails.PictureURL && Array.isArray(item.PictureDetails.PictureURL)) {
      pictureUrlsXml = item.PictureDetails.PictureURL.map((url: string) => `<PictureURL>${url}</PictureURL>`).join("")
    }

    return `<?xml version="1.0" encoding="utf-8"?>
      <AddFixedPriceItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
        <RequesterCredentials>
          <eBayAuthToken>${this.accessToken}</eBayAuthToken>
        </RequesterCredentials>
        <Item>
          <Title>${item.Title}</Title>
          <Description>${item.Description}</Description>
          <StartPrice currencyID="${item.Currency}">${item.StartPrice}</StartPrice>
          <CategoryID>${item.CategoryID}</CategoryID>
          <PictureDetails>
            ${pictureUrlsXml}
          </PictureDetails>
          <ConditionID>${item.ConditionID}</ConditionID>
          <ListingDuration>${item.ListingDuration}</ListingDuration>
          <ListingType>${item.ListingType}</ListingType>
          <Currency>${item.Currency}</Currency>
        </Item>
      </AddFixedPriceItemRequest>`
  }

  private parseXMLResponse(xml: string) {
    // Simplified parser - in production, use a proper XML parser
    const success = xml.includes("<Ack>Success</Ack>")
    const itemId = xml.match(/<ItemID>(\d+)<\/ItemID>/)?.[1]

    return {
      success,
      itemId,
      rawResponse: xml,
    }
  }
}
