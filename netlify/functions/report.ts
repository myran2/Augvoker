require("dotenv").config();
import { Handler, HandlerEvent } from "@netlify/functions";
import axios from "axios";
import { config } from "dotenv";
config();

type WclApiError = {
  error: {
    code: number;
    message: string;
  };
};

const getError = (error: unknown): { msg: string } => {
  if ((error as WclApiError).error) {
    return {
      msg: (error as WclApiError).error.message,
    };
  }

  if ((error as Error).message) {
    return {
      msg: (error as Error).message,
    };
  }

  return {
    msg: "An unknown error occurred",
  };
};

const getParameter = (event: HandlerEvent, parameter: string): string => {
  if (!event.queryStringParameters) {
    throw new Error("No parameters passed!");
  }

  if (!event.queryStringParameters[parameter]) {
    throw new Error(`No ${parameter} passed!`);
  }

  return event.queryStringParameters[parameter]!;
};

const handler: Handler = async (event: HandlerEvent, context) => {
  try {
    if (!event) {
      throw new Error("No event!");
    }

    const reportId = getParameter(event, "reportId");
    const response = await axios.get(
      `https://www.warcraftlogs.com/v1/report/fights/${reportId}`,
      {
        headers: { Accept: "application/json" },
        params: { "api_key": process.env.WCL_API_KEY },
      }
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(response.data),
    }

  } catch (error) {
    const e = getError(error);
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(e.msg),
    };
  }
};

export { handler };
