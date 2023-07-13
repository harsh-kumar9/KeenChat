import { convoActions } from "../reducers/convoSlice";
import { langchainActions } from "../reducers/langchainSlice";

import { OpenAI } from "langchain/llms/openai";
import { HuggingFaceInference } from "langchain/llms/hf";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";

const model = new OpenAI({
  model: "gpt-3.5-turbo-0613",
  openAIApiKey: process.env.REACT_APP_OPENAI_API_TOKEN,
  temperature: 0.9,
  streaming: true,
});

// const back_channel_model = new HuggingFaceInference({
//   model: "SamLowe/roberta-base-go_emotions",
//   apiKey: process.env.REACT_APP_HUGGINGFACEHUB_API_KEY,
// });

const back_channel_model_name = "SamLowe/roberta-base-go_emotions";

export const ask = (
  promptTemplate,
  botIdentifier,
  humanIdentifier,
  inputJSON
) => {
  return async (dispatch) => {
    const prompt = PromptTemplate.fromTemplate(promptTemplate);
    const chain = new LLMChain({ llm: model, prompt });

    const res = await chain.call(inputJSON, [
      {
        handleChainStart(chain) {
          //   console.log("new chain");
          //   console.log(chain);
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

    // console.log(res);
  };
};

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
