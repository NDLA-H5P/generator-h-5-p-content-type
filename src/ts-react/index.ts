import type { Answers, Question } from "inquirer";
import Generator from "yeoman-generator";
import { pascalCase, paramCase } from "change-case";
import superb from "superb";
import { generatorName } from "../_utils/vars";

export default class extends Generator {
  private promptAnswers: Answers;

  async prompting(): Promise<void> {
    const prompts: Question[] = [
      {
        type: "input",
        name: "title",
        message: "What is the content type's title?",
        default: "Content Type",
      },
      {
        type: "confirm",
        name: "isEditor",
        message: "Is this an editor content type?",
        default: false,
      },
      {
        type: "confirm",
        name: "shouldAddStorybook",
        message: "Do you want Storybook to be set up?",
        default: true,
      },
    ];

    this.promptAnswers = await this.prompt<Question>(prompts);
  }

  writing(): void {
    const title: string = this.promptAnswers.title;
    const titlePascalCase = pascalCase(title);
    const titleKebabCase = paramCase(title);

    const isEditor: boolean = this.promptAnswers.isEditor;

    const shouldAddStorybook: boolean = this.promptAnswers.shouldAddStorybook;

    if (isEditor) {
      this.composeWith(`${generatorName}:editor-base`);
    } else {
      this.composeWith(`${generatorName}:base`);
    }

    this.fs.copyTpl(
      this.templatePath("root/**/*"),
      this.destinationPath(""),
      {
        title,
        titlePascalCase,
        titleKebabCase,
        superb: superb.random(),
      },
    );

    if (shouldAddStorybook) {
      const packageFile = JSON.parse(this.fs.read("package.json"));

      packageFile.scripts = {
        ...packageFile.scripts,
        "storybook": "start-storybook -p 6006",
        "build-storybook": "build-storybook"
      };

      packageFile.devDependencies = {
        ...packageFile.devDependencies,
        "@storybook/addon-actions": "^6.3.7",
        "@storybook/addon-essentials": "^6.3.7",
        "@storybook/addon-links": "^6.3.7",
        "@storybook/builder-webpack5": "^6.3.7",
        "@storybook/manager-webpack5": "^6.3.7",
        "@storybook/react": "^6.3.7",
      };
      this.fs.writeJSON("package.json", packageFile);

      this.fs.copy(
        this.templatePath("storybook/.storybook/**/*"),
        this.destinationPath(""),
      );

      this.fs.copy(
        this.templatePath("storybook/stories/**/*"),
        this.destinationPath("src"),
      );
    }

    const library = JSON.parse(this.fs.read("library.json"));
    library.preloadedJs.path = "dist/build.js";
    this.fs.writeJSON("library.json", library);
  }
}
