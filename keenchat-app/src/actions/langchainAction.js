import { convoActions } from "../reducers/convoSlice";
import { langchainActions } from "../reducers/langchainSlice";

import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";

const model = new OpenAI({
  model: "gpt-3.5-turbo-0613",
  openAIApiKey: process.env.REACT_APP_OPENAI_API_TOKEN,
  temperature: 0.9,
  streaming: true,
});

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
          history[humanIdentifier] = inputJSON.input;
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
