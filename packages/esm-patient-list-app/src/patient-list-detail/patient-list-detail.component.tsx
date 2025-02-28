import React, { useState, useCallback, useMemo } from 'react';
import { ExtensionSlot, showToast, navigate, formatDate, parseDate } from '@openmrs/esm-framework';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { OverflowMenuItem } from '@carbon/react';
import { OverflowMenuVertical } from '@carbon/react/icons';
import CustomOverflowMenuComponent from '../overflow-menu/overflow-menu.component';
import EditPatientListDetailsOverlay from '../create-edit-patient-list/create-edit-list.component';
import PatientListTable from '../patient-table/patient-table.component';
import { deletePatientList } from '../api/api-remote';
import { usePatientListDetails, usePatientListMembers } from '../api/hooks';
import styles from './patient-list-detail.scss';

interface PatientListMemberRow {
  name: string;
  identifier: string;
  sex: string;
  startDate: string;
  uuid: string;
}

const PatientListDetailComponent = () => {
  const params = useParams();
  const patientListUuid = params.patientListUuid;
  const { t } = useTranslation();
  const [currentPage, setPageCount] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(10);
  const [searchString, setSearchString] = useState('');
  const { data: patientListDetails, mutate: mutatePatientListDetails } = usePatientListDetails(patientListUuid);
  const { data: patientListMembers } = usePatientListMembers(
    patientListUuid,
    searchString,
    (currentPage - 1) * currentPageSize,
    currentPageSize,
  );
  const [showEditPatientListDetailOverlay, setEditPatientListDetailOverlay] = useState(false);

  const patients: PatientListMemberRow[] = useMemo(
    () =>
      patientListMembers
        ? patientListMembers?.length
          ? patientListMembers?.map((member) => ({
              name: member?.patient?.person?.display,
              identifier: member?.patient?.identifiers[0]?.identifier ?? null,
              sex: member?.patient?.person?.gender,
              startDate: formatDate(parseDate(member?.startDate)),
              uuid: `${member?.patient?.uuid}`,
            }))
          : []
        : [],
    [patientListMembers],
  );

  const headers = useMemo(
    () => [
      {
        key: 'name',
        header: t('name', 'Name'),
        link: {
          getUrl: (patient) =>
            patient?.uuid ? `${window.spaBase}/patient/${patient?.uuid}/chart/` : window?.location?.href,
        },
      },
      {
        key: 'identifier',
        header: t('identifier', 'Identifier'),
      },
      {
        key: 'sex',
        header: t('sex', 'Sex'),
      },
      {
        key: 'startDate',
        header: t('startDate', 'Start Date'),
      },
    ],
    [t],
  );

  const handleSearch = useCallback((str) => {
    setPageCount(1);
    setSearchString(str);
  }, []);

  const handleDelete = useCallback(() => {
    deletePatientList(patientListUuid)
      .then(() =>
        showToast({
          title: t('deleted', 'Deleted'),
          description: `${t('deletedPatientList', 'Deleted patient list')}: ${patientListDetails?.name}`,
          kind: 'success',
        }),
      )
      .then(() => navigate({ to: `${window.spaBase}/home/patient-lists/` }))
      .catch(() =>
        showToast({
          title: t('error', 'Error'),
          description: t('errorDeleteList', "Couldn't delete patient list"),
          kind: 'error',
        }),
      );
  }, [patientListUuid, patientListDetails, t]);

  return (
    <main className={`omrs-main-content ${styles.patientListDetailsPage}`}>
      <section>
        <ExtensionSlot name="breadcrumbs-slot" />
        <div className={styles.cohortHeader} data-testid="patientListHeader">
          <div>
            {patientListDetails && (
              <>
                <h1 className={styles.productiveHeading03}>{patientListDetails?.name}</h1>
                <h4 className={`${styles.bodyShort02} ${styles.marginTop}`}>{patientListDetails?.description}</h4>
                <div className={` ${styles.text02} ${styles.bodyShort01} ${styles.marginTop}`}>
                  {patientListDetails?.size} {t('patients', 'patients')} &middot;{' '}
                  <span className={styles.label01}>{t('createdOn', 'Created on')}:</span>{' '}
                  {patientListDetails?.startDate ? formatDate(parseDate(patientListDetails.startDate)) : null}
                </div>
              </>
            )}
          </div>
          <CustomOverflowMenuComponent
            menuTitle={
              <>
                <span className={styles.actionsButtonText}>{t('actions', 'Actions')}</span>{' '}
                <OverflowMenuVertical size={16} style={{ marginLeft: '0.5rem' }} />
              </>
            }>
            <OverflowMenuItem
              itemText={t('editNameDescription', 'Edit Name/ Description')}
              onClick={() => setEditPatientListDetailOverlay(true)}
            />
            <OverflowMenuItem itemText={t('delete', 'Delete')} onClick={handleDelete} isDelete />
          </CustomOverflowMenuComponent>
        </div>
        <div className={styles.tableContainer}>
          <PatientListTable
            patients={patients}
            columns={headers}
            isLoading={!patientListMembers && !patients}
            isFetching={!patientListMembers}
            search={{
              onSearch: handleSearch,
              placeHolder: 'Search',
            }}
            pagination={{
              usePagination: patientListDetails?.size > currentPageSize,
              currentPage,
              onChange: ({ page, pageSize }) => {
                setPageCount(page);
                setCurrentPageSize(pageSize);
              },
              pageSize: 10,
              totalItems: patientListDetails?.size,
              pagesUnknown: true,
              lastPage:
                patients?.length < currentPageSize || currentPage * currentPageSize === patientListDetails?.size,
            }}
          />
        </div>
      </section>
      <section>
        {showEditPatientListDetailOverlay && (
          <EditPatientListDetailsOverlay
            close={() => setEditPatientListDetailOverlay(false)}
            edit
            patientListDetails={patientListDetails}
            onSuccess={mutatePatientListDetails}
          />
        )}
      </section>
    </main>
  );
};

export default PatientListDetailComponent;
