package version

import "runtime"

// Version information injected at build time via -ldflags.
var (
	Version   = "dev"
	GitCommit = ""
	BuildDate = ""
	GoVersion = runtime.Version()
)

// Info represents build and runtime version metadata.
type Info struct {
	Version   string `json:"version"`
	GitCommit string `json:"git_commit"`
	BuildDate string `json:"build_date"`
	GoVersion string `json:"go_version"`
}

// GetVersionInfo returns the current version metadata.
func GetVersionInfo() Info {
	return Info{
		Version:   Version,
		GitCommit: GitCommit,
		BuildDate: BuildDate,
		GoVersion: GoVersion,
	}
}
