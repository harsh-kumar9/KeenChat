import { convoActions } from "../reducers/convoSlice";
import { langchainActions } from "../reducers/langchainSlice";
import { OpenAIChat } from "langchain/llms/openai";
import { HuggingFaceInference } from "langchain/llms/hf";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";

// Model
// const model = new OpenAI({
//   model: "gpt-3.5-turbo-0613",
//   openAIApiKey: process.env.REACT_APP_OPENAI_API_TOKEN,
//   temperature: 0.9,
//   streaming: true,
// });

const model = new OpenAIChat({
  temperature: 0, // determine how stochastic we want it to be, 0 for experimentation
  azureOpenAIApiKey: "ec79f9fb01954ecbaf4f727ff65ede2f",
  azureOpenAIApiVersion: "2023-07-01-preview",
  azureOpenAIApiInstanceName: "quickta-playground",
  azureOpenAIApiDeploymentName: "GPT3_16k",
});

const back_channel_model = new OpenAIChat({
  temperature: 0.5, // determine how stochastic we want it to be, 0 for experimentation
  azureOpenAIApiKey: "ec79f9fb01954ecbaf4f727ff65ede2f",
  azureOpenAIApiVersion: "2023-07-01-preview",
  azureOpenAIApiInstanceName: "quickta-playground",
  azureOpenAIApiDeploymentName: "GPT3_16k",
});

// const back_channel_model = new HuggingFaceInference({
//   model: "SamLowe/roberta-base-go_emotions",
//   apiKey: process.env.REACT_APP_HUGGINGFACEHUB_API_KEY,
// });

const back_channel_model_name = "SamLowe/roberta-base-go_emotions";

/**
 * Dispatches an asynchronous action to handle user input and generate responses.
 *
 * @param {string} promptTemplate - The template for generating prompts.
 * @param {string} botIdentifier - Identifier for the bot in the conversation.
 * @param {string} humanIdentifier - Identifier for the human in the conversation.
 * @param {Object} inputJSON - The input data in JSON format.
 * @returns {Function} An asynchronous function that dispatches actions based on language model responses.
 */

export const ask_backchannel = (prompt, message) => {
  return async (dispatch) => {
    const promptTemplate = PromptTemplate.fromTemplate(prompt);
    const chain = new LLMChain({
      llm: back_channel_model,
      prompt: promptTemplate,
    });
    const res = await chain.run(message);
    console.log({ res });
    return res;
  };
};

export const ask = (
  promptTemplate,
  botIdentifier,
  humanIdentifier,
  inputJSON
) => {
  return async (dispatch) => {
    // create prompt template
    const prompt = PromptTemplate.fromTemplate(promptTemplate);

    // create chain using prompt template
    const chain = new LLMChain({ llm: model, prompt });

    // call chain
    const res = await chain.call(inputJSON, [
      {
        handleChainStart(chain) {
          //   console.log("new chain");
          //   console.logl(chain);
          const history = {};
          history[humanIdentifier] = inputJSON.inputs;
          dispatch(langchainActions.pushHistory({ history }));
          dispatch(langchainActions.sLoading({ isLoading: true }));
        },
        handleChainEnd(chain) {
          //   console.log("chain loaded");
          //   console.log(chain);
          const payload = {
            msg: chain.text,
          };
          dispatch(langchainActions.addBotMsgToLatestMsg(payload));
          dispatch(langchainActions.sLoading({ isLoading: false }));
        },
        handleLLMNewToken(token) {
          const payload = { token };
          //   console.log(payload);
          dispatch(convoActions.addToken(payload));
        },
      },
    ]);

    return res;
  };
};

// Generate reactions based on input
export const react = (inputJSON) => {
  return async (dispatch) => {
    // const res = await back_channel_model.call(JSON.stringify(inputJSON));
    // console.log({ res });

    async function query(data) {
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${back_channel_model_name}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_HUGGINGFACEHUB_API_KEY}`,
          },
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      const result = await response.json();
      return result;
    }

    const reactions = await query(inputJSON);

    if (reactions[0]?.length > 0 && reactions[0][0].score > 0.5) {
      const bestReaction = reactions[0][0];
      dispatch(convoActions.sReaction(bestReaction));
    }
  };
};
