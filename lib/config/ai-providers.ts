import fs from "fs"
import path from "path"
import { env } from "@/lib/env"

// Define AI provider types
export type AIProvider = "openai" | "anthropic"

// Model configuration
export type AIModelConfig = {
  name: string
  baseURL: string
  apiKey: string
}

// Provider configuration
export type AIProviderConfig = {
  provider: AIProvider
  models: AIModelConfig[]
}

// Full configuration
export type AIProvidersConfig = {
  providers: Record<AIProvider, AIProviderConfig>
}

// Processed model configuration (with resolved environment variables)
export type ProcessedAIModelConfig = {
  name: string
  baseURL: string
  apiKey: string
}

// Processed provider configuration
export type ProcessedAIProviderConfig = {
  provider: AIProvider
  models: ProcessedAIModelConfig[]
}

// Cache for the loaded configuration
let configCache: Record<AIProvider, ProcessedAIProviderConfig> | null = null

// Get the current config file path
export function getConfigFilePath(): string {
  // Use default path
  const configFileName = "data/config.json"
  const configFilePath = path.join(process.cwd(), configFileName)

  return configFilePath
}

// Function to load and parse the AI providers configuration
export function loadAIProvidersConfig(
  forceReload = false,
): Record<AIProvider, ProcessedAIProviderConfig> {
  // Return cached config if available and not forcing reload
  if (configCache && !forceReload) {
    return configCache
  }

  try {
    const configFilePath = getConfigFilePath()
    console.log(`Loading AI providers config from: ${configFilePath}`)

    // Read and parse the configuration file
    const configFileContent = fs.readFileSync(configFilePath, "utf-8")
    const config = JSON.parse(configFileContent) as AIProvidersConfig

    // Process the configuration
    const processedConfig = Object.entries(config.providers).reduce(
      (acc, [key, providerConfig]) => {
        const provider = key as AIProvider

        // Process models - directly use the values from the config file
        const processedModels = providerConfig.models.map(model => {
          return {
            ...model,
          }
        })

        acc[provider] = {
          provider,
          models: processedModels,
        }

        return acc
      },
      {} as Record<AIProvider, ProcessedAIProviderConfig>,
    )

    // Update cache
    configCache = processedConfig

    return processedConfig
  } catch (error) {
    console.error("Error loading AI providers configuration:", error)
    throw new Error(`Failed to load AI providers configuration: ${error}`)
  }
}

// Function to get the current AI providers configuration
export function getAIProviders(): Record<
  AIProvider,
  ProcessedAIProviderConfig
> {
  return loadAIProvidersConfig()
}

// Helper function to find model configuration by name
export function findModelConfig(
  provider: AIProvider,
  modelName: string,
): ProcessedAIModelConfig {
  const providerConfig = getAIProviders()[provider]

  // Find the model by name
  const modelConfig = providerConfig.models.find(
    model => model.name === modelName,
  )

  if (!modelConfig) {
    throw new Error(`Model "${modelName}" not found for provider "${provider}"`)
  }

  return modelConfig
}

// Function to reload the configuration (useful for admin panels)
export function reloadAIProvidersConfig(): Record<
  AIProvider,
  ProcessedAIProviderConfig
> {
  return loadAIProvidersConfig(true)
}
