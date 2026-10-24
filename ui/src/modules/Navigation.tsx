import { IconDeviceGamepad2 } from "@tabler/icons-react";
// Root imports on purpose: core-ui shares `erxes-ui` as a Module Federation
// singleton keyed on the bare specifier, so deep imports would bundle a second
// private copy instead of reusing the host's.
import { NavigationMenuLinkItem, Sidebar } from "erxes-ui";
import manifest from "../../../erxes.json" with { type: "json" };

const { path } = manifest.ui;
const base = `/${path}`;

export const Navigation = () => (
  <Sidebar.Group>
    <Sidebar.GroupLabel>Тоглоом</Sidebar.GroupLabel>
    <Sidebar.GroupContent>
      <Sidebar.Menu>
        <NavigationMenuLinkItem
          name="Уралдаан"
          icon={IconDeviceGamepad2}
          path={base}
        />
      </Sidebar.Menu>
    </Sidebar.GroupContent>
  </Sidebar.Group>
);
