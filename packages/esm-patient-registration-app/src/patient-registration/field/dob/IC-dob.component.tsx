import React, { useContext } from 'react';
import { ContentSwitcher, DatePickerInput, Switch, TextInput } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { useField } from 'formik';
import { generateFormatting } from '../../date-util';
import { PatientRegistrationContext } from '../../patient-registration-context';
import styles from '../field.scss';
import { useConfig } from '@openmrs/esm-framework';
import { RegistrationConfig } from '../../../config-schema';
import { DatePicker, Provider, defaultTheme } from '@adobe/react-spectrum';
import '@react-spectrum/datepicker/dist/main';
import { parseDate, EthiopicCalendar, toCalendar, CalendarDate } from '@internationalized/date';
import { date } from 'yup';

const calcBirthdate = (yearDelta, monthDelta, dateOfBirth) => {
  const { enabled, month, dayOfMonth } = dateOfBirth.useEstimatedDateOfBirth;
  const startDate = new Date();
  const resultMonth = new Date(startDate.getFullYear() - yearDelta, startDate.getMonth() - monthDelta, 1);
  const daysInResultMonth = new Date(resultMonth.getFullYear(), resultMonth.getMonth() + 1, 0).getDate();
  const resultDate = new Date(
    resultMonth.getFullYear(),
    resultMonth.getMonth(),
    Math.min(startDate.getDate(), daysInResultMonth),
  );
  return enabled ? new Date(resultDate.getFullYear(), month, dayOfMonth) : resultDate;
};

export const ICDobField: React.FC = () => {
  const { t } = useTranslation();
  const {
    fieldConfigurations: { dateOfBirth },
  } = useConfig() as RegistrationConfig;
  const [dobUnknown] = useField('birthdateEstimated');
  const dobKnown = !dobUnknown.value;
  const [birthdate, birthdateMeta] = useField('birthdate');
  const [yearsEstimated, yearsEstimateMeta] = useField('yearsEstimated');
  const [monthsEstimated, monthsEstimateMeta] = useField('monthsEstimated');
  const { setFieldValue } = useContext(PatientRegistrationContext);
  const { format, placeHolder, dateFormat } = generateFormatting(['d', 'm', 'Y'], '/');
  const today = new Date();
  const { locale } = dateOfBirth.useInternationalCalendars;

  const onToggle = (e) => {
    setFieldValue('birthdateEstimated', e.name === 'unknown');
    setFieldValue('birthdate', '');
    setFieldValue('yearsEstimated', '');
    setFieldValue('monthsEstimated', '');
  };

  const onDateChange = ([date]) => {
    var newDate = new Date(date);
    newDate.setHours(12);
    const refinedDate = date instanceof Date ? new Date(date.getTime() - date.getTimezoneOffset() * 60000) : newDate;
    setFieldValue('birthdate', refinedDate);
  };

  const onEstimatedYearsChange = (ev) => {
    const years = +ev.target.value;

    if (!isNaN(years) && years < 140 && years >= 0) {
      setFieldValue('yearsEstimated', years);
      setFieldValue('birthdate', calcBirthdate(years, monthsEstimateMeta.value, dateOfBirth));
    }
  };
  const isIsoDate = (str) => {
    var regex = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/g;
    if (!regex.test(str)) {
      return false;
    }
    return true;
  };
  const formatDate = (value) => {
    // yyyy-mm-dd
    if (!value) {
      return null;
    }
    let dmy = new Date(value).toLocaleDateString('en-US').split('/');
    if (dmy.length == 3) {
      let year = parseInt(dmy[2], 10);
      let month = parseInt(dmy[0], 10);
      let day = parseInt(dmy[1], 10);
      let finalDate = year + '-' + formatDigit(month) + '-' + formatDigit(day);
      return finalDate;
    } else {
      return null;
    }
  };
  const formatDigit = (number) => {
    return parseInt(number, 10).toLocaleString('en-US', {
      minimumIntegerDigits: 2,
      useGrouping: false,
    });
  };

  const onEstimatedMonthsChange = (e) => {
    const months = +e.target.value;

    if (!isNaN(months) && months <= 11 && months >= 0) {
      setFieldValue('monthsEstimated', months);
      setFieldValue('birthdate', calcBirthdate(yearsEstimateMeta.value, months, dateOfBirth));
    }
  };

  return (
    <div className={styles.halfWidthInDesktopView}>
      <h4 className={styles.productiveHeading02Light}>{t('birthFieldLabelText', 'Birth')}</h4>
      <div className={styles.dobField}>
        <div className={styles.dobContentSwitcherLabel}>
          <span className={styles.label01}>{t('dobToggleLabelText', 'Date of Birth Known?')}</span>
        </div>
        <ContentSwitcher onChange={onToggle}>
          <Switch name="known" text={t('yes', 'Yes')} />
          <Switch name="unknown" text={t('no', 'No')} />
        </ContentSwitcher>
      </div>
      {dobKnown ? (
        <div className={styles.dobField}>
          <Provider locale={locale} colorScheme="light" theme={defaultTheme}>
            <DatePicker
              value={
                formatDate(birthdate.value) != null
                  ? isIsoDate(formatDate(birthdate.value))
                    ? parseDate(formatDate(birthdate.value))
                    : null
                  : null
              }
              onChange={(e) => {
                onDateChange([e]);
              }}
              label="Date"></DatePicker>
          </Provider>
        </div>
      ) : (
        <div className={styles.grid}>
          <TextInput
            id="yearsEstimated"
            type="number"
            name={yearsEstimated.name}
            light
            onChange={onEstimatedYearsChange}
            labelText={t('estimatedAgeInYearsLabelText', 'Estimated age in years')}
            invalid={!!(yearsEstimateMeta.touched && yearsEstimateMeta.error)}
            invalidText={yearsEstimateMeta.error && t(yearsEstimateMeta.error)}
            value={yearsEstimated.value}
            min={0}
            required
          />
          <TextInput
            id="monthsEstimated"
            type="number"
            name={monthsEstimated.name}
            light
            onChange={onEstimatedMonthsChange}
            labelText={t('estimatedAgeInMonthsLabelText', 'Estimated age in months')}
            invalid={!!(monthsEstimateMeta.touched && monthsEstimateMeta.error)}
            invalidText={monthsEstimateMeta.error && t(monthsEstimateMeta.error)}
            value={monthsEstimated.value}
            min={0}
          />
        </div>
      )}
    </div>
  );
};
