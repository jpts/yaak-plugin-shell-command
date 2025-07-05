import type { CallTemplateFunctionArgs, Context, PluginDefinition } from "@yaakapp/api";

import { execSync } from "node:child_process";

export const plugin: PluginDefinition = {
    templateFunctions: [
        {
            name: "shell_command",
            description: "Run a shell command.",
            args: [
                {
                    type: "text",
                    name: "cmd",
                    label: "Command",
                },
                {
                    type: "select",
                    name: "interpreter",
                    label: "Shell Intepreter",
                    defaultValue: "/bin/sh",
                    options: [
                        { label: "Bash", value: "/bin/bash" },
                        { label: "Zsh", value: "/bin/zsh" },
                        { label: "sh", value: "/bin/sh" },
                    ],
                }
            ],
            onRender: async (
                ctx: Context,
                { values, purpose }: CallTemplateFunctionArgs,
            ): Promise<string | null> => {
                if (!values.cmd || !values.interpreter) return null;

                console.log(`Running command with ${values.interpreter}: ${values.cmd}`);

                let out: string;
                try {
                    out = execSync(values.cmd, {
                        shell: values.interpreter,
                        timeout: 10 * 1000,
                        encoding: "utf-8",
                    });
                } catch (err) {
                    const err_m = (err as Error).message;
                    console.error(`Command failed: ${err_m}`);
                    return err_m;
                }

                return out.toString().trim();
            },
        },
    ],
};
