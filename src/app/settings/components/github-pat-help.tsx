import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, HelpCircle } from "lucide-react";
import Link from "next/link";

export function GitHubPATHelp() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-sm">
          <HelpCircle className="h-4 w-4 mr-1" />
          How to create
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[600px]">
        <AlertDialogHeader>
          <AlertDialogTitle>
            How to Create a GitHub Personal Access Token
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-sm">
              <p>
                Follow these steps to create a Personal Access Token (PAT) for
                GitHub:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-4 text-left">
                <li>
                  Go to <strong>GitHub Settings</strong> →{" "}
                  <strong>Developer settings</strong> →{" "}
                  <strong>Personal access tokens</strong>
                </li>
                <li>
                  Click <strong>"Generate new token"</strong>
                </li>
                <li>
                  Give your token a descriptive name (e.g., "CodeOrient App")
                </li>
                <li>Set an expiration date (recommended: 90 days or 1 year)</li>
                <li>Select the required scopes:</li>
                <ul className="list-disc list-inside ml-6 space-y-1">
                  <li>
                    <Badge variant="secondary" className="mr-2">
                      repo
                    </Badge>{" "}
                    - Full access to repositories
                  </li>
                  <li>
                    <Badge variant="secondary" className="mr-2">
                      read:org
                    </Badge>{" "}
                    - Read organisation membership
                  </li>
                </ul>
                <li>
                  Click <strong>"Generate token"</strong>
                </li>
                <li>
                  Copy the token immediately (you won't be able to see it again)
                </li>
                <li>Paste it into the field above</li>
              </ol>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 dark:bg-yellow-950 dark:border-yellow-800">
                <p className="text-yellow-800 dark:text-yellow-200">
                  <strong>Important:</strong> Keep your token secure and never
                  share it publicly. We encrypt and store it securely in our
                  database.
                </p>
              </div>

              <div className="flex justify-end pt-2 space-x-6">
                <Button variant="outline" asChild>
                  <Link
                    href="https://github.com/settings/personal-access-tokens"
                    target="_blank"
                    className="flex items-center gap-2"
                  >
                    Open GitHub Settings
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
}
