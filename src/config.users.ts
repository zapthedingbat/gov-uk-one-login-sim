import { UserinfoTemplate } from "./lib/types";
import users from "../config/users.json";

export const userTemplates: { [key: string]: UserinfoTemplate } = users;

/*
{
  KENNETH_DECERQUEIRA: {
    sub: "urn:fdc:gov.uk:2022:56P4CMsGh_02YOlWpd8PAOI-2sVlB2nsNU7mcLZY_ken",
    email: "kenneth.decerqueira@example.com",
    phone_number: "07700900001",
    coreIdentity: {
      name: [
        {
          nameParts: [
            {
              value: "KENNETH",
              type: "GivenName",
            },
            {
              value: "DECERQUEIRA",
              type: "FamilyName",
            },
          ],
        },
      ],
      birthDate: [
        {
          value: "1965-07-08",
        },
      ],
    },
  },
  JEMIMA_PUDDLEDUCK: {
    sub: "urn:fdc:gov.uk:2022:56P4CMsGh_02YOlWpd8PAOI-2sVlB2nsNU7mcLZY_jem",
    email: "jemima.puddleduck@example.com",
    phone_number: "07700900002",
    coreIdentity: {
      name: [
        {
          nameParts: [
            {
              value: "JEMIMA",
              type: "GivenName",
            },
            {
              value: "PUDDLEDUCK",
              type: "FamilyName",
            },
          ],
        },
      ],
      birthDate: [
        {
          value: "1998-12-01",
        },
      ],
    },
  },
};
*/
